import { WebviewTag } from 'electron';
import jsStringEscape from 'js-string-escape';
import { EditorEngine } from '..';
import { escapeSelector } from '/common/helpers';
import { DomElement, TextDomElement } from '/common/models/element';

export class TextEditingManager {
    isEditing = false;
    shouldNotStartEditing = false;

    constructor(private editorEngine: EditorEngine) {}

    async start(el: DomElement, webview: WebviewTag) {
        const stylesBeforeEdit: Record<string, string> =
            (await webview.executeJavaScript(
                `window.api?.getComputedStyleBySelector('${escapeSelector(el.selector)}')`,
            )) || {};

        const textDomEl: TextDomElement | null = await webview.executeJavaScript(
            `window.api?.startEditingText('${escapeSelector(el.selector)}')`,
        );

        if (!textDomEl) {
            console.log('Failed to edit text: Invalid element');
            return;
        }
        this.isEditing = true;
        this.shouldNotStartEditing = true;
        this.editorEngine.history.startTransaction();

        const adjustedRect = this.editorEngine.overlay.adaptRectFromSourceElement(
            textDomEl.rect,
            webview,
        );
        const isComponent = this.editorEngine.ast.getInstance(textDomEl.selector) !== undefined;

        this.editorEngine.overlay.clear();

        this.editorEngine.overlay.updateEditTextInput(
            adjustedRect,
            textDomEl.textContent,
            stylesBeforeEdit,
            this.createCurriedEdit(textDomEl.textContent, webview),
            this.createCurriedEnd(webview),
            isComponent,
        );
    }

    async edit(originalContent: string, newContent: string, webview: WebviewTag) {
        if (!this.isEditing) {
            return;
        }
        const textDomEl: TextDomElement | null = await webview.executeJavaScript(
            `window.api?.editText('${jsStringEscape(newContent)}')`,
        );
        if (!textDomEl) {
            return;
        }

        const adjustedRect = this.editorEngine.overlay.adaptRectFromSourceElement(
            textDomEl.rect,
            webview,
        );
        this.editorEngine.overlay.updateTextInputSize(adjustedRect);

        this.editorEngine.history.push({
            type: 'edit-text',
            targets: [{ webviewId: webview.id, selector: textDomEl.selector }],
            originalContent,
            newContent,
        });
    }

    async end(webview: WebviewTag) {
        this.isEditing = false;
        this.editorEngine.overlay.removeEditTextInput();
        await webview.executeJavaScript(`window.api?.stopEditingText()`);
        this.editorEngine.history.commitTransaction();
        this.shouldNotStartEditing = false;
    }

    private createCurriedEdit(originalContent: string, webview: WebviewTag) {
        return (content: string) => this.edit(originalContent, content, webview);
    }

    private createCurriedEnd(webview: WebviewTag) {
        return () => this.end(webview);
    }
}
