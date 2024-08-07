import { getStyles } from './style';
import { EditorAttributes } from '/common/constants';
import { getUniqueSelector } from '/common/helpers';
import { DomElement, ParentDomElement } from '/common/models/element';

export const getDeepElement = (x: number, y: number): Element | undefined => {
    const el = document.elementFromPoint(x, y);
    if (!el) {
        return;
    }
    const crawlShadows = (node: Element): Element => {
        if (node?.shadowRoot) {
            const potential = node.shadowRoot.elementFromPoint(x, y);
            if (potential == node) {
                return node;
            } else if (potential?.shadowRoot) {
                return crawlShadows(potential);
            } else {
                return potential || node;
            }
        } else {
            return node;
        }
    };

    const nested_shadow = crawlShadows(el);
    return nested_shadow || el;
};

export const getDomElement = (el: HTMLElement): DomElement => {
    const parent = el.parentElement;
    const parentDomElement: ParentDomElement = {
        selector: getUniqueSelector(parent as HTMLElement),
        rect: parent?.getBoundingClientRect() as DOMRect,
        encodedTemplateNode: parent?.getAttribute(EditorAttributes.DATA_ONLOOK_ID) || undefined,
    };

    const rect = el.getBoundingClientRect();
    const styles = getStyles(el);
    const selector = getUniqueSelector(el as HTMLElement);
    const encodedTemplateNode = el.getAttribute(EditorAttributes.DATA_ONLOOK_ID) || undefined;
    const domElement: DomElement = {
        selector,
        rect,
        tagName: el.tagName,
        parent: parentDomElement,
        styles,
        encodedTemplateNode,
    };
    return JSON.parse(JSON.stringify(domElement));
};
