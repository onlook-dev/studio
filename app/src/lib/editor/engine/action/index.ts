import { sendAnalytics } from '@/lib/utils';
import { EditorEngine } from '..';
import {
    Action,
    EditTextAction,
    InsertElementAction,
    MoveElementAction,
    RemoveElementAction,
    UpdateStyleAction,
} from '/common/actions';
import { WebviewChannels } from '/common/constants';
import { assertNever } from '/common/helpers';

export class ActionManager {
    constructor(private editorEngine: EditorEngine) {}

    run(action: Action) {
        this.editorEngine.history.push(action);
        this.dispatch(action);
    }

    undo() {
        const action = this.editorEngine.history.undo();
        if (action == null) {
            return;
        }
        this.dispatch(action);
        sendAnalytics('undo');
    }

    redo() {
        const action = this.editorEngine.history.redo();
        if (action == null) {
            return;
        }
        this.dispatch(action);
        sendAnalytics('redo');
    }

    private dispatch(action: Action) {
        switch (action.type) {
            case 'update-style':
                this.updateStyle(action);
                break;
            case 'insert-element':
                this.insertElement(action);
                break;
            case 'remove-element':
                this.removeElement(action);
                break;
            case 'move-element':
                this.moveElement(action);
                break;
            case 'edit-text':
                this.editText(action);
                break;
            default:
                assertNever(action);
        }
    }

    private updateStyle({ targets, style }: UpdateStyleAction) {
        targets.forEach((target) => {
            const webview = this.editorEngine.webviews.getWebview(target.webviewId);
            if (!webview) {
                return;
            }
            webview.send(WebviewChannels.UPDATE_STYLE, {
                selector: target.selector,
                style,
                value: target.change.updated,
            });
        });
    }

    private insertElement({ targets, element, styles, editText, location }: InsertElementAction) {
        targets.forEach((elementMetadata) => {
            const webview = this.editorEngine.webviews.getWebview(elementMetadata.webviewId);
            if (!webview) {
                return;
            }
            const payload = JSON.parse(
                JSON.stringify({
                    location,
                    element,
                    styles,
                    editText,
                }),
            );
            webview.send(WebviewChannels.INSERT_ELEMENT, payload);
        });
    }

    private removeElement({ targets, location, codeBlock }: RemoveElementAction) {
        targets.forEach((target) => {
            const webview = this.editorEngine.webviews.getWebview(target.webviewId);
            if (!webview) {
                return;
            }
            const payload = JSON.parse(JSON.stringify({ location, hide: codeBlock !== undefined }));
            webview.send(WebviewChannels.REMOVE_ELEMENT, payload);
        });
    }

    private moveElement({ targets, location }: MoveElementAction) {
        targets.forEach((target) => {
            const webview = this.editorEngine.webviews.getWebview(target.webviewId);
            if (!webview) {
                return;
            }
            webview.send(WebviewChannels.MOVE_ELEMENT, {
                selector: target.selector,
                originalIndex: location.originalIndex,
                newIndex: location.index,
            });
        });
    }

    private editText({ targets, newContent }: EditTextAction) {
        targets.forEach((elementMetadata) => {
            const webview = this.editorEngine.webviews.getWebview(elementMetadata.webviewId);
            if (!webview) {
                return;
            }
            webview.send(WebviewChannels.EDIT_ELEMENT_TEXT, {
                selector: elementMetadata.selector,
                content: newContent,
            });
        });
    }
}
