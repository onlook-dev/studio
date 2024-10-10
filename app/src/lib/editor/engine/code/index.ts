import { sendAnalytics } from '@/lib/utils';
import { makeAutoObservable } from 'mobx';
import { EditorEngine } from '..';
import { getOrCreateCodeDiffRequest, getTailwindClassChangeFromStyle } from './helpers';
import { getInsertedElement, getRemovedElement } from './insert';
import {
    Action,
    EditTextAction,
    InsertElementAction,
    MoveElementAction,
    RemoveElementAction,
    UpdateStyleAction,
} from '/common/actions';
import { MainChannels, WebviewChannels } from '/common/constants';
import { assertNever } from '/common/helpers';
import { CodeDiff, CodeDiffRequest } from '/common/models/code';
import {
    DomActionType,
    InsertedElement,
    MovedElement,
    RemovedElement,
    StyleChange,
    TextEditedElement,
} from '/common/models/element/domAction';
import { TemplateNode } from '/common/models/element/templateNode';

export class CodeManager {
    isExecuting = false;
    private moveCleanDebounceTimer: Timer | null = null;
    private queuedMoveFilesToClean: Set<string> = new Set();
    private writeQueue: Action[] = [];

    constructor(private editorEngine: EditorEngine) {
        makeAutoObservable(this);
    }

    getCodeDiff(requests: CodeDiffRequest[]): Promise<CodeDiff[]> {
        return window.api.invoke(MainChannels.GET_CODE_DIFFS, JSON.parse(JSON.stringify(requests)));
    }

    viewSource(templateNode?: TemplateNode): void {
        if (!templateNode) {
            console.error('No template node found.');
            return;
        }
        window.api.invoke(MainChannels.VIEW_SOURCE_CODE, templateNode);
        sendAnalytics('view source code');
    }

    async getCodeBlock(templateNode?: TemplateNode): Promise<string | null> {
        if (!templateNode) {
            console.error('No template node found.');
            return null;
        }
        return window.api.invoke(MainChannels.GET_CODE_BLOCK, templateNode);
    }

    async write(action: Action) {
        this.writeQueue.push(action);
        if (!this.isExecuting) {
            await this.processWriteQueue();
        }
    }

    private async processWriteQueue() {
        this.isExecuting = true;
        while (this.writeQueue.length > 0) {
            const action = this.writeQueue.shift();
            if (action) {
                await this.executeWrite(action);
            }
        }
        this.isExecuting = false;
    }

    private async executeWrite(action: Action) {
        switch (action.type) {
            case 'update-style':
                await this.writeStyle(action);
                break;
            case 'insert-element':
                await this.writeInsert(action);
                break;
            case 'move-element':
                await this.writeMove(action);
                break;
            case 'remove-element':
                await this.writeRemove(action);
                break;
            case 'edit-text':
                await this.writeEditText(action);
                break;
            default:
                assertNever(action);
        }
        sendAnalytics('write code');
    }

    async writeStyle({ targets, style }: UpdateStyleAction) {
        const styleChanges: StyleChange[] = [];
        targets.map((target) => {
            styleChanges.push({
                selector: target.selector,
                styles: {
                    [style]: target.change.updated,
                },
            });
        });

        const requests = await this.getCodeDiffRequests({ styleChanges });
        this.getAndWriteCodeDiff(requests);
    }

    async writeInsert({ location, element, styles }: InsertElementAction) {
        const insertedEls = [getInsertedElement(element, location, styles)];
        const requests = await this.getCodeDiffRequests({ insertedEls });
        this.getAndWriteCodeDiff(requests);
    }

    private async writeRemove({ location }: RemoveElementAction) {
        const removedEls = [getRemovedElement(location)];
        const requests = await this.getCodeDiffRequests({ removedEls });
        this.getAndWriteCodeDiff(requests);
    }

    private async writeMove({ targets, location }: MoveElementAction) {
        const movedEls: MovedElement[] = [];

        for (const target of targets) {
            movedEls.push({
                type: DomActionType.MOVE,
                location: location,
                selector: target.selector,
            });
        }

        const requests = await this.getCodeDiffRequests({ movedEls });
        const res = await this.getAndWriteCodeDiff(requests);
        if (res) {
            requests.forEach((request) =>
                this.queuedMoveFilesToClean.add(request.templateNode.path),
            );
            this.debounceMoveCleanup();
        }
    }

    private async writeEditText({ targets, newContent }: EditTextAction) {
        const textEditEls: TextEditedElement[] = [];

        for (const target of targets) {
            textEditEls.push({
                selector: target.selector,
                content: newContent,
            });
        }

        const requestMap = await this.getCodeDiffRequests({ textEditEls });
        this.getAndWriteCodeDiff(requestMap);
    }

    private async getAndWriteCodeDiff(requests: CodeDiffRequest[]) {
        const codeDiffs = await this.getCodeDiff(requests);
        console.log('Code diffs:', codeDiffs);
        const res = await window.api.invoke(MainChannels.WRITE_CODE_BLOCKS, codeDiffs);
        if (res) {
            this.editorEngine.webviews.getAll().forEach((webview) => {
                webview.send(WebviewChannels.CLEAN_AFTER_WRITE_TO_CODE);
            });
        }
        return res;
    }

    private async getCodeDiffRequests({
        styleChanges,
        insertedEls,
        removedEls,
        movedEls,
        textEditEls,
    }: {
        styleChanges?: StyleChange[];
        insertedEls?: InsertedElement[];
        removedEls?: RemovedElement[];
        movedEls?: MovedElement[];
        textEditEls?: TextEditedElement[];
    }): Promise<CodeDiffRequest[]> {
        const templateToRequest = new Map<TemplateNode, CodeDiffRequest>();
        await this.processStyleChanges(styleChanges || [], templateToRequest);
        await this.processInsertedElements(insertedEls || [], templateToRequest);
        await this.processMovedElements(movedEls || [], templateToRequest);
        await this.processTextEditElements(textEditEls || [], templateToRequest);
        await this.processRemovedElements(removedEls || [], templateToRequest);
        return Array.from(templateToRequest.values());
    }

    private debounceMoveCleanup() {
        if (this.moveCleanDebounceTimer) {
            clearTimeout(this.moveCleanDebounceTimer);
        }

        this.moveCleanDebounceTimer = setTimeout(() => {
            if (this.queuedMoveFilesToClean.size > 0) {
                const files = Array.from(this.queuedMoveFilesToClean);
                window.api.invoke(MainChannels.CLEAN_MOVE_KEYS, files);
                this.queuedMoveFilesToClean.clear();
            }
            this.moveCleanDebounceTimer = null;
        }, 5000);
    }

    private async processStyleChanges(
        styleChanges: StyleChange[],
        templateToCodeChange: Map<TemplateNode, CodeDiffRequest>,
    ): Promise<void> {
        for (const change of styleChanges) {
            const templateNode = await this.getTemplateNodeForSelector(change.selector);
            if (!templateNode) {
                continue;
            }

            const request = await getOrCreateCodeDiffRequest(
                templateNode,
                change.selector,
                templateToCodeChange,
            );
            getTailwindClassChangeFromStyle(request, change.styles);
        }
    }

    private async processInsertedElements(
        insertedEls: InsertedElement[],
        templateToCodeChange: Map<TemplateNode, CodeDiffRequest>,
    ): Promise<void> {
        for (const insertedEl of insertedEls) {
            const targetTemplateNode = await this.getTemplateNodeForSelector(
                insertedEl.location.targetSelector,
            );
            if (!targetTemplateNode) {
                continue;
            }

            const request = await getOrCreateCodeDiffRequest(
                targetTemplateNode,
                insertedEl.location.targetSelector,
                templateToCodeChange,
            );
            request.insertedElements.push(insertedEl);
        }
    }

    private async processRemovedElements(
        removedEls: RemovedElement[],
        templateToCodeChange: Map<TemplateNode, CodeDiffRequest>,
    ): Promise<void> {
        for (const removedEl of removedEls) {
            const targetTemplateNode = await this.getTemplateNodeForSelector(
                removedEl.location.targetSelector,
            );
            if (!targetTemplateNode) {
                continue;
            }

            const request = await getOrCreateCodeDiffRequest(
                targetTemplateNode,
                removedEl.location.targetSelector,
                templateToCodeChange,
            );
            request.removedElements.push(removedEl);
        }
    }

    private async processMovedElements(
        movedEls: MovedElement[],
        templateToCodeChange: Map<TemplateNode, CodeDiffRequest>,
    ): Promise<void> {
        for (const movedEl of movedEls) {
            const parentTemplateNode = await this.getTemplateNodeForSelector(
                movedEl.location.targetSelector,
            );
            if (!parentTemplateNode) {
                continue;
            }

            const request = await getOrCreateCodeDiffRequest(
                parentTemplateNode,
                movedEl.location.targetSelector,
                templateToCodeChange,
            );
            const childTemplateNode = await this.getTemplateNodeForSelector(movedEl.selector);
            if (!childTemplateNode) {
                continue;
            }
            const movedElWithTemplate = { ...movedEl, templateNode: childTemplateNode };
            request.movedElements.push(movedElWithTemplate);
        }
    }

    private async processTextEditElements(
        textEditEls: TextEditedElement[],
        templateToCodeChange: Map<TemplateNode, CodeDiffRequest>,
    ) {
        for (const textEl of textEditEls) {
            const templateNode = await this.getTemplateNodeForSelector(textEl.selector);
            if (!templateNode) {
                continue;
            }

            const request = await getOrCreateCodeDiffRequest(
                templateNode,
                textEl.selector,
                templateToCodeChange,
            );
            request.textContent = textEl.content;
        }
    }

    private async getTemplateNodeForSelector(selector: string): Promise<TemplateNode | undefined> {
        return (
            this.editorEngine.ast.getInstance(selector) ?? this.editorEngine.ast.getRoot(selector)
        );
    }
}
