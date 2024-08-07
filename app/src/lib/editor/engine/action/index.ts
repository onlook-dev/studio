import { HistoryManager } from '../history';
import { WebviewManager } from '../webview';
import { Action, ActionTarget } from '/common/actions';
import { WebviewChannels } from '/common/constants';

export class ActionManager {
    constructor(
        private history: HistoryManager,
        private webviews: WebviewManager,
    ) {}

    run(action: Action) {
        this.history.push(action);
        this.dispatch(action);
    }

    undo() {
        const action = this.history.undo();
        if (action == null) {
            return;
        }

        this.dispatch(action);
    }

    redo() {
        const action = this.history.redo();
        if (action == null) {
            return;
        }

        this.dispatch(action);
    }

    private dispatch(action: Action) {
        switch (action.type) {
            case 'update-style':
                this.updateStyle(action.targets, action.style, action.change.updated);
                break;
            case 'insert-element':
                this.insertElement(action.targets, action.position, action.change.updated);
                break;
        }
    }

    private updateStyle(targets: Array<ActionTarget>, style: string, value: string) {
        targets.forEach((elementMetadata) => {
            const webview = this.webviews.getWebview(elementMetadata.webviewId);
            if (!webview) {
                return;
            }
            webview.send(WebviewChannels.UPDATE_STYLE, {
                selector: elementMetadata.selector,
                style: style,
                value: value,
            });
        });
    }

    private insertElement(
        targets: Array<ActionTarget>,
        position: 'before' | 'after' | 'prepend' | 'append' | number,
        element: string,
    ) {
        targets.forEach((elementMetadata) => {
            const webview = this.webviews.getWebview(elementMetadata.webviewId);
            if (!webview) {
                return;
            }
            // webview.send(WebviewChannels.INSERT_ELEMENT, {
            //     selector: elementMetadata.selector,
            //     position: position,
            //     element: element,
            // });
        });
    }
}
