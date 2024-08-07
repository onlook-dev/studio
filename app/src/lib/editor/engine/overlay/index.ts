import { ClickRect, HoverRect, InsertRect, ParentRect } from './rect';
import { querySelectorCommand } from '/common/helpers';

export class OverlayManager {
    overlayContainer: HTMLElement | undefined;
    hoverRect: HoverRect;
    insertRect: InsertRect;
    clickedRects: ClickRect[];
    parentRect: ParentRect;
    scrollPosition: { x: number; y: number } = { x: 0, y: 0 };

    constructor() {
        this.hoverRect = new HoverRect();
        this.insertRect = new InsertRect();
        this.parentRect = new ParentRect();
        this.clickedRects = [];
        this.bindMethods();
    }

    setOverlayContainer = (container: HTMLElement) => {
        this.overlayContainer = container;
        this.appendRectToPopover(this.hoverRect.element);
        this.appendRectToPopover(this.insertRect.element);
        this.appendRectToPopover(this.parentRect.element);
    };

    bindMethods = () => {
        this.setOverlayContainer = this.setOverlayContainer.bind(this);
        this.updateHoverRect = this.updateHoverRect.bind(this);
        this.updateInsertRect = this.updateInsertRect.bind(this);
        this.updateParentRect = this.updateParentRect.bind(this);
        this.hideHoverRect = this.hideHoverRect.bind(this);
        this.showHoverRect = this.showHoverRect.bind(this);
        this.removeHoverRect = this.removeHoverRect.bind(this);
        this.removeClickedRects = this.removeClickedRects.bind(this);
        this.clear = this.clear.bind(this);
    };

    getBoundingRect(selector: string, sourceWebview: Electron.WebviewTag) {
        return sourceWebview.executeJavaScript(
            `${querySelectorCommand(selector)}.getBoundingClientRect().toJSON()`,
            true,
        );
    }

    getComputedStyle(
        selector: string,
        sourceWebview: Electron.WebviewTag,
    ): Promise<CSSStyleDeclaration> {
        return sourceWebview.executeJavaScript(
            `getComputedStyle(${querySelectorCommand(selector)})`,
            true,
        );
    }

    getRelativeOffset(element: HTMLElement, ancestor: HTMLElement) {
        let top = 0,
            left = 0;
        while (element && element !== ancestor) {
            top += element.offsetTop || 0;
            left += element.offsetLeft || 0;
            element = element.offsetParent as HTMLElement;
        }
        return { top, left };
    }

    adaptRectFromSourceElement(rect: DOMRect, webview: Electron.WebviewTag) {
        const commonAncestor = this.overlayContainer?.parentElement as HTMLElement;
        const sourceOffset = this.getRelativeOffset(webview, commonAncestor);

        const overlayOffset = this.overlayContainer
            ? this.getRelativeOffset(this.overlayContainer, commonAncestor)
            : { top: 0, left: 0 };

        const adjustedRect = {
            ...rect,
            top: rect.top + sourceOffset.top - overlayOffset.top,
            left: rect.left + sourceOffset.left - overlayOffset.left,
        };
        return adjustedRect;
    }

    appendRectToPopover = (rect: HTMLElement) => {
        if (this.overlayContainer) {
            this.overlayContainer.appendChild(rect);
        }
    };

    clear = () => {
        this.removeParentRect();
        this.removeHoverRect();
        this.removeClickedRects();
    };

    addClickRect = (rect: DOMRect, style: Record<string, string> | CSSStyleDeclaration) => {
        const clickRect = new ClickRect();
        this.appendRectToPopover(clickRect.element);
        this.clickedRects.push(clickRect);
        clickRect.render({
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left,
            padding: style.padding,
            margin: style.margin,
        });
    };

    updateParentRect = (el: HTMLElement) => {
        if (!el) {
            return;
        }
        const rect = el.getBoundingClientRect();
        this.parentRect.render(rect);
    };

    updateHoverRect = (rect: DOMRect) => {
        this.hoverRect.render(rect);
    };

    updateInsertRect = (rect: DOMRect) => {
        this.insertRect.render(rect);
    };

    hideHoverRect = () => {
        this.hoverRect.element.style.display = 'none';
    };

    showHoverRect = () => {
        this.hoverRect.element.style.display = 'block';
    };

    removeHoverRect = () => {
        this.hoverRect.render({ width: 0, height: 0, top: 0, left: 0 });
    };

    removeInsertRect = () => {
        this.insertRect.render({ width: 0, height: 0, top: 0, left: 0 });
    };

    removeClickedRects = () => {
        this.clickedRects.forEach((clickRect) => {
            clickRect.element.remove();
        });
        this.clickedRects = [];
    };

    removeParentRect = () => {
        this.parentRect.render({ width: 0, height: 0, top: 0, left: 0 });
    };
}
