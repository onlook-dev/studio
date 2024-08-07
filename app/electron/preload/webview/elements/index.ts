import { getDeepElement, getDomElement } from './helpers';
import { EditorAttributes } from '/common/constants';
import { DomElement } from '/common/models/element';

export const getElementWithSelector = (selector: string): DomElement => {
    const el = (document.querySelector(selector) as HTMLElement) || document.body;
    return getDomElement(el);
};

export const getElements = (selector: string): DomElement[] => {
    const el = document.querySelector(selector) || document.body;
    const els = getRelatedElements(el as HTMLElement);
    const elsMetadata = els.map((el) => getDomElement(el));
    return [getDomElement(el as HTMLElement), ...elsMetadata];
};

export const getElementAtLoc = (x: number, y: number): DomElement => {
    const el = getDeepElement(x, y) || document.body;
    return getDomElement(el as HTMLElement);
};

export const getElementsAtLoc = (x: number, y: number): DomElement[] => {
    const el = (getDeepElement(x, y) as HTMLElement) || document.body;
    const els = [el, ...getRelatedElements(el as HTMLElement)];
    const elsMetadata = els.map((element) => getDomElement(element));
    return elsMetadata;
};

const getRelatedElements = (el: HTMLElement): HTMLElement[] => {
    const encodedTemplateNode = el.getAttribute(EditorAttributes.DATA_ONLOOK_ID) || undefined;
    if (!encodedTemplateNode) {
        return [];
    }

    const els = document.querySelectorAll(
        `[${EditorAttributes.DATA_ONLOOK_ID}="${encodedTemplateNode}"]`,
    );
    return Array.from(els) as HTMLElement[];
};
