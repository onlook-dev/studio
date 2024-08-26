import { ipcRenderer } from 'electron';
import { getDomElement } from './helpers';
import { EditorAttributes, WebviewChannels } from '/common/constants';
import { getUniqueSelector } from '/common/helpers';
import { DomElement } from '/common/models/element';

enum DisplayDirection {
    VERTICAL = 'vertical',
    HORIZONTAL = 'horizontal',
}

export function moveElementBySelector(selector: string, newIndex: number): DomElement | undefined {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) {
        console.error(`Element not found: ${selector}`);
        return;
    }
    const movedEl = moveElementByIndex(el, newIndex);
    if (!movedEl) {
        console.error(`Failed to move element: ${selector}`);
        return;
    }
    const domEl = getDomElement(movedEl, true);
    return domEl;
}

// TODO: Consolidate with the other move function
function moveElementByIndex(el: HTMLElement, newIndex: number): HTMLElement | undefined {
    const parent = el.parentElement;
    if (!parent) {
        return;
    }
    parent.removeChild(el);
    if (newIndex >= parent.children.length) {
        parent.appendChild(el);
        return el;
    }

    const referenceNode = parent.children[newIndex];
    parent.insertBefore(el, referenceNode);
    return el;
}

export function startDrag(selector: string, newUniqueId: string): number {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) {
        console.error(`Element not found: ${selector}`);
        return -1;
    }
    const originalIndex = Array.from(el.parentElement!.children).indexOf(el);
    markElementForDragging(el, originalIndex, newUniqueId);
    createStub(el);
    return originalIndex;
}

export function drag(dx: number, dy: number, x: number, y: number) {
    const el = getDragElement();
    el.style.position = 'fixed';
    el.style.transform = `translate(${dx}px, ${dy}px)`;
    moveStub(el, x, y);
}

export function endDrag(): { newSelector: string; newIndex: number } {
    const el = getDragElement();
    const newIndex = getNewIndex(el);
    const currentIndex = Array.from(el.parentElement!.children).indexOf(el);
    if (newIndex !== -1 && newIndex !== currentIndex) {
        moveDraggedElement(el, newIndex);
    }

    removeStub();
    const originalIndex = parseInt(
        el.getAttribute(EditorAttributes.DATA_ONLOOK_ORIGINAL_INDEX) || '-1',
        10,
    );
    const afterMoveIndex = Array.from(el.parentElement!.children).indexOf(el);
    restoreElementState(el, originalIndex, afterMoveIndex);
    publishMoveEvent(el);
    const newSelector = getUniqueSelector(el);
    return { newSelector, newIndex: afterMoveIndex };
}

function publishMoveEvent(el: HTMLElement) {
    ipcRenderer.sendToHost(WebviewChannels.ELEMENT_MOVED, getDomElement(el, true));
}

function getNewIndex(el: HTMLElement): number {
    const stub = document.getElementById(EditorAttributes.ONLOOK_STUB_ID);
    if (!stub || !el.parentElement) {
        return -1;
    }

    const siblings = Array.from(el.parentElement.children);
    return siblings.indexOf(stub);
}

function moveDraggedElement(el: HTMLElement, newIndex: number): HTMLElement | undefined {
    const parent = el.parentElement;
    if (!parent) {
        return;
    }

    const referenceNode = parent.children[newIndex];
    parent.insertBefore(el, referenceNode);
    return el;
}

function getDragElement(): HTMLElement {
    const el = document.querySelector(
        `[${EditorAttributes.DATA_ONLOOK_DRAGGING}]`,
    ) as HTMLElement | null;
    if (!el) {
        throw new Error('Element not found');
    }
    return el;
}

function markElementForDragging(el: HTMLElement, originalIndex: number, newUniqueId: string) {
    const saved = el.getAttribute(EditorAttributes.DATA_ONLOOK_SAVED_STYLE);
    if (saved) {
        return;
    }

    const style = {
        position: el.style.position,
        transform: el.style.transform,
    };

    el.setAttribute(EditorAttributes.DATA_ONLOOK_SAVED_STYLE, JSON.stringify(style));
    el.setAttribute(EditorAttributes.DATA_ONLOOK_DRAGGING, 'true');

    if (el.getAttribute(EditorAttributes.DATA_ONLOOK_UNIQUE_ID) === null) {
        el.setAttribute(EditorAttributes.DATA_ONLOOK_UNIQUE_ID, newUniqueId);
    }

    if (el.getAttribute(EditorAttributes.DATA_ONLOOK_ORIGINAL_INDEX) === null) {
        el.setAttribute(EditorAttributes.DATA_ONLOOK_ORIGINAL_INDEX, originalIndex.toString());
    }

    if (el.getAttribute(EditorAttributes.DATA_ONLOOK_DRAG_DIRECTION) !== null) {
        const parent = el.parentElement;
        if (parent) {
            const displayDirection = getDisplayDirection(parent);
            el.setAttribute(EditorAttributes.DATA_ONLOOK_DRAG_DIRECTION, displayDirection);
        }
    }
}

function restoreElementState(el: HTMLElement, originalIndex: number, newIndex: number) {
    try {
        const saved = el.getAttribute(EditorAttributes.DATA_ONLOOK_SAVED_STYLE);
        if (saved) {
            const style = JSON.parse(saved);
            for (const key in style) {
                el.style[key as any] = style[key];
            }
        }
    } catch (e) {
        console.error(e);
    }

    el.removeAttribute(EditorAttributes.DATA_ONLOOK_SAVED_STYLE);
    el.removeAttribute(EditorAttributes.DATA_ONLOOK_DRAGGING);
    el.removeAttribute(EditorAttributes.DATA_ONLOOK_DRAG_DIRECTION);

    if (originalIndex !== newIndex) {
        el.setAttribute(EditorAttributes.DATA_ONLOOK_NEW_INDEX, newIndex.toString());
    } else {
        el.removeAttribute(EditorAttributes.DATA_ONLOOK_ORIGINAL_INDEX);
        el.removeAttribute(EditorAttributes.DATA_ONLOOK_NEW_INDEX);
    }
}

function createStub(el: HTMLElement) {
    const styles = window.getComputedStyle(el);
    const stub = document.createElement('div');
    stub.id = 'onlook-drag-stub';
    stub.style.width = styles.width;
    stub.style.height = styles.height;
    stub.style.margin = styles.margin;
    stub.style.padding = styles.padding;
    stub.style.borderRadius = styles.borderRadius;
    stub.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
    stub.style.display = 'none';
    document.body.appendChild(stub);
}

function moveStub(el: HTMLElement, x: number, y: number) {
    const stub = document.getElementById('onlook-drag-stub');
    if (!stub) {
        return;
    }
    const parent = el.parentElement;
    if (!parent) {
        return;
    }

    const siblings = Array.from(parent.children).filter((child) => child !== el && child !== stub);
    let displayDirection = el.getAttribute(EditorAttributes.DATA_ONLOOK_DRAG_DIRECTION);
    if (!displayDirection) {
        displayDirection = getDisplayDirection(parent);
    }
    const index = findInsertionIndex(siblings, x, y, displayDirection as DisplayDirection);

    stub.remove();
    if (index >= siblings.length) {
        parent.appendChild(stub);
    } else {
        parent.insertBefore(stub, siblings[index]);
    }
    stub.style.display = 'block';
}

function getDisplayDirection(element: HTMLElement): DisplayDirection {
    if (!element || !element.children || element.children.length < 2) {
        return DisplayDirection.VERTICAL;
    }

    const children = Array.from(element.children);
    const firstChild = children[0];
    const secondChild = children[1];

    const firstRect = firstChild.getBoundingClientRect();
    const secondRect = secondChild.getBoundingClientRect();

    if (Math.abs(firstRect.left - secondRect.left) < Math.abs(firstRect.top - secondRect.top)) {
        return DisplayDirection.VERTICAL;
    } else {
        return DisplayDirection.HORIZONTAL;
    }
}

function findInsertionIndex(
    elements: Element[],
    x: number,
    y: number,
    displayDirection: DisplayDirection,
): number {
    const midPoints = elements.map((el) => {
        const rect = el.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        };
    });

    for (let i = 0; i < midPoints.length; i++) {
        if (displayDirection === DisplayDirection.VERTICAL) {
            if (y < midPoints[i].y) {
                return i;
            }
        } else {
            if (x < midPoints[i].x) {
                return i;
            }
        }
    }
    return elements.length;
}

function removeStub() {
    const stub = document.getElementById(EditorAttributes.ONLOOK_STUB_ID);
    if (!stub) {
        return;
    }
    stub.remove();
}