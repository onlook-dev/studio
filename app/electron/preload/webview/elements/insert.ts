import { CssStyleChange } from '../style';
import { getDeepElement, getDomElement } from './helpers';
import { ActionElement, ActionElementLocation } from '/common/actions';
import { EditorAttributes, INLINE_ONLY_CONTAINERS } from '/common/constants';
import { getUniqueSelector } from '/common/helpers';
import { InsertPos } from '/common/models';
import { DomElement } from '/common/models/element';

export function getInsertLocation(x: number, y: number): ActionElementLocation | undefined {
    const targetEl = findNearestBlockLevelContainer(x, y);
    if (!targetEl) {
        return;
    }
    const targetSelector = getUniqueSelector(targetEl);
    const location: ActionElementLocation = {
        position: InsertPos.APPEND,
        targetSelector: targetSelector,
    };
    return location;
}

function findNearestBlockLevelContainer(x: number, y: number): HTMLElement | null {
    let targetEl = getDeepElement(x, y) as HTMLElement | null;
    if (!targetEl) {
        return null;
    }

    let inlineOnly = true;
    while (targetEl && inlineOnly) {
        inlineOnly = INLINE_ONLY_CONTAINERS.has(targetEl.tagName.toLowerCase());
        if (inlineOnly) {
            targetEl = targetEl.parentElement;
        }
    }
    return targetEl;
}

export function insertElement(
    element: ActionElement,
    location: ActionElementLocation,
    style: Record<string, string>,
): DomElement | undefined {
    const targetEl = document.querySelector(location.targetSelector);
    if (!targetEl) {
        console.error(`Target element not found: ${location.targetSelector}`);
        return;
    }

    const newEl = createElement(element);

    switch (location.position) {
        case InsertPos.APPEND:
            targetEl.appendChild(newEl);
            break;
        case InsertPos.PREPEND:
            targetEl.prepend(newEl);
            break;
        case InsertPos.BEFORE:
            targetEl.before(newEl);
            break;
        case InsertPos.AFTER:
            targetEl.after(newEl);
            break;
        case InsertPos.INDEX:
            if (location.index === undefined || location.index < 0) {
                console.error(`Invalid index: ${location.index}`);
                return;
            }

            if (location.index >= targetEl.children.length) {
                targetEl.appendChild(newEl);
            } else {
                targetEl.insertBefore(newEl, targetEl.children.item(location.index));
            }
            break;
        default:
            console.error(`Invalid position: ${location.position}`);
            return;
    }

    const change = new CssStyleChange();
    const selector = getUniqueSelector(newEl);
    for (const [key, value] of Object.entries(style)) {
        change.updateStyle(selector, key, value);
    }

    const domEl = getDomElement(newEl, true);
    return domEl;
}

function createElement(element: ActionElement) {
    const newEl = document.createElement(element.tagName);
    for (const [key, value] of Object.entries(element.attributes)) {
        newEl.setAttribute(key, value);
    }
    newEl.textContent = element.textContent;

    for (const child of element.children) {
        const childEl = createElement(child);
        newEl.appendChild(childEl);
    }

    return newEl;
}

export function removeElement(location: ActionElementLocation, hide = true): DomElement | null {
    const targetEl = document.querySelector(location.targetSelector) as HTMLElement | null;

    if (!targetEl) {
        console.error(`Target element not found: ${location.targetSelector}`);
        return null;
    }

    let elementToRemove: HTMLElement | null = null;

    switch (location.position) {
        case InsertPos.APPEND:
            elementToRemove = targetEl.lastElementChild as HTMLElement | null;
            break;
        case InsertPos.PREPEND:
            elementToRemove = targetEl.firstElementChild as HTMLElement | null;
            break;
        case InsertPos.BEFORE:
            elementToRemove = targetEl.previousElementSibling as HTMLElement | null;
            break;
        case InsertPos.AFTER:
            elementToRemove = targetEl.nextElementSibling as HTMLElement | null;
            break;
        case InsertPos.INDEX:
            if (location.index !== undefined) {
                elementToRemove = targetEl.children.item(location.index) as HTMLElement | null;
            } else {
                console.error(`Invalid index: ${location.index}`);
                return null;
            }
            break;
        default:
            console.error(`Invalid position: ${location.position}`);
            return null;
    }

    if (elementToRemove) {
        const domEl = getDomElement(elementToRemove, true);
        if (hide) {
            elementToRemove.style.display = 'none';
        } else {
            elementToRemove.remove();
        }
        return domEl;
    } else {
        console.warn(`No element found to remove at the specified location`);
        return null;
    }
}

export function removeInsertedElements() {
    const insertedEls = document.querySelectorAll(`[${EditorAttributes.DATA_ONLOOK_INSERTED}]`);
    for (const el of insertedEls) {
        el.remove();
    }
}
