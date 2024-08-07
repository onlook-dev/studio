import { CssStyleChange } from '../changes';
import { getDeepElement, getDomElement } from './helpers';

export function insertElement(x: number, y: number, width: number, height: number, tag: string) {
    const el = getDeepElement(x, y) as HTMLElement | undefined;
    if (!el) {
        return;
    }
    const newDiv = document.createElement(tag);
    el.appendChild(newDiv);

    const domEl = getDomElement(newDiv);
    const change = new CssStyleChange();
    change.updateStyle(domEl.selector, 'width', `${width}px`);
    change.updateStyle(domEl.selector, 'height', `${height}px`);
    change.updateStyle(domEl.selector, 'backgroundColor', 'rgb(120, 113, 108)');
    return domEl;
}

export function insertTextElement(
    x: number,
    y: number,
    width: number,
    height: number,
    content: string = 'Lorem Ipsum',
) {
    const el = getDeepElement(x, y) as HTMLElement | undefined;
    if (!el) {
        return;
    }
    const newP = document.createElement('p');
    newP.textContent = content;
    el.appendChild(newP);

    const domEl = getDomElement(newP);
    const change = new CssStyleChange();
    change.updateStyle(domEl.selector, 'width', `${width}px`);
    change.updateStyle(domEl.selector, 'height', `${height}px`);
    return domEl;
}
