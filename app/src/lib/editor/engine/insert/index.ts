import { EditorMode } from '@/lib/models';
import { nanoid } from 'nanoid';
import React from 'react';
import { ActionManager } from '../action';
import { OverlayManager } from '../overlay';
import { ActionElement, ActionTarget } from '/common/actions';
import { EditorAttributes } from '/common/constants';
import { ElementPosition } from '/common/models/element';

// @ts-expect-error - No type for tokens
import { colors } from '/common/tokens';

export class InsertManager {
    isDrawing: boolean = false;
    private drawOrigin: { overlay: ElementPosition; webview: ElementPosition } | undefined;

    constructor(
        private overlay: OverlayManager,
        private action: ActionManager,
    ) {}

    start(
        e: React.MouseEvent<HTMLDivElement>,
        getRelativeMousePositionToOverlay: (e: React.MouseEvent<HTMLDivElement>) => ElementPosition,
        getRelativeMousePositionToWebview: (e: React.MouseEvent<HTMLDivElement>) => ElementPosition,
    ) {
        this.isDrawing = true;
        const overlayPos = getRelativeMousePositionToOverlay(e);
        const webviewPos = getRelativeMousePositionToWebview(e);
        this.drawOrigin = { overlay: overlayPos, webview: webviewPos };
        this.updateInsertRect(overlayPos);
    }

    draw(
        e: React.MouseEvent<HTMLDivElement>,
        getRelativeMousePositionToOverlay: (e: React.MouseEvent<HTMLDivElement>) => ElementPosition,
    ) {
        if (!this.isDrawing || !this.drawOrigin) {
            return;
        }

        const currentPos = getRelativeMousePositionToOverlay(e);
        const newRect = this.getDrawRect(this.drawOrigin.overlay, currentPos);
        this.overlay.updateInsertRect(newRect);
    }

    end(
        e: React.MouseEvent<HTMLDivElement>,
        webview: Electron.WebviewTag | null,
        getRelativeMousePositionToWebview: (e: React.MouseEvent<HTMLDivElement>) => ElementPosition,
        mode: EditorMode,
    ) {
        if (!this.isDrawing || !this.drawOrigin) {
            return null;
        }

        this.isDrawing = false;
        this.overlay.removeInsertRect();

        const webviewPos = getRelativeMousePositionToWebview(e);
        const newRect = this.getDrawRect(this.drawOrigin.webview, webviewPos);
        if (!webview) {
            console.error('Webview not found');
            return;
        }
        this.insertElement(webview, newRect, mode);
        this.drawOrigin = undefined;
    }

    private updateInsertRect(pos: ElementPosition) {
        const { x, y } = pos;
        const rect = new DOMRect(x, y, 0, 0);
        this.overlay.updateInsertRect(rect);
    }

    private getDrawRect(drawStart: ElementPosition, currentPos: ElementPosition): DOMRect {
        const { x, y } = currentPos;
        let startX = drawStart.x;
        let startY = drawStart.y;
        let width = x - startX;
        let height = y - startY;

        if (width < 0) {
            startX = x;
            width = Math.abs(width);
        }

        if (height < 0) {
            startY = y;
            height = Math.abs(height);
        }

        return new DOMRect(startX, startY, width, height);
    }

    async insertElement(
        webview: Electron.WebviewTag,
        newRect: { x: number; y: number; width: number; height: number },
        mode: EditorMode,
    ) {
        const location = await webview.executeJavaScript(
            `window.api?.getInsertLocation(${this.drawOrigin?.webview.x}, ${this.drawOrigin?.webview.y})`,
        );
        if (!location) {
            console.error('Insert position not found');
            return;
        }

        const targets: Array<ActionTarget> = [
            {
                webviewId: webview.id,
            },
        ];

        const id = nanoid();
        const actionElement: ActionElement = {
            tagName: mode === EditorMode.INSERT_TEXT ? 'p' : 'div',
            attributes: {
                id,
                [EditorAttributes.DATA_ONLOOK_UNIQUE_ID]: id,
                [EditorAttributes.DATA_ONLOOK_INSERTED]: 'true',
                [EditorAttributes.DATA_ONLOOK_TIMESTAMP]: Date.now().toString(),
            },
            children: [],
            textContent: '',
        };

        const width = Math.max(Math.round(newRect.width), 30);
        const height = Math.max(Math.round(newRect.height), 30);
        const defaultStyles =
            mode === EditorMode.INSERT_TEXT
                ? {
                      width: `${width}px`,
                      height: `${height}px`,
                  }
                : {
                      width: `${width}px`,
                      height: `${height}px`,
                      backgroundColor: colors.blue[100],
                  };

        this.action.run({
            type: 'insert-element',
            targets: targets,
            location: location,
            element: actionElement,
            styles: defaultStyles as Record<string, string>,
            editText: mode === EditorMode.INSERT_TEXT,
        });
    }
}
