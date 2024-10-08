import { getDomElement } from './helpers';
import { ActionElementLocation } from '/common/actions';
import { EditorAttributes } from '/common/constants';
import { CopiedElement } from '/common/models/element/domAction';

export function copyElementBySelector(selector: string): CopiedElement | null {
    const el = document.querySelector(selector) as HTMLElement;

    if (!el) {
        console.error('Element not found for selector:', selector);
        return null;
    }

    const clonedEl = el.cloneNode(true) as HTMLElement;
    cleanClonedElement(clonedEl);
    const htmlContent = new XMLSerializer().serializeToString(clonedEl);
    return {
        selector,
        htmlContent,
    };
}

export function pasteElements(location: ActionElementLocation, elements: CopiedElement[]) {
    const targetEl: HTMLElement | null = document.querySelector(
        location.targetSelector,
    ) as HTMLElement;
    if (!targetEl) {
        console.error(`Target element not found: ${location.targetSelector}`);
        return;
    }

    for (const copiedEl of elements) {
        targetEl.insertAdjacentHTML('afterend', copiedEl.htmlContent);
    }
    return getDomElement(targetEl, true);
}

export function pastElementAfterSelector(selector: string, html: string) {
    const el = document.querySelector(selector) as HTMLElement;
    if (!el) {
        console.error('Element not found for selector:', selector);
        return;
    }
    el.insertAdjacentHTML('afterend', html);
}

function cleanClonedElement(el: HTMLElement) {
    el.removeAttribute(EditorAttributes.DATA_ONLOOK_UNIQUE_ID);
    el.removeAttribute(EditorAttributes.DATA_ONLOOK_TIMESTAMP);
}
