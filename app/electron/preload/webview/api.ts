import { contextBridge } from 'electron';
import { getElementAtLoc, getElementWithSelector } from './elements';
import { insertElement, insertTextElement } from './elements/insert';

export function setApi() {
    contextBridge.exposeInMainWorld('api', {
        getElementAtLoc: getElementAtLoc,
        getElementWithSelector: getElementWithSelector,
        insertElement: insertElement,
        insertTextElement: insertTextElement,
    });
}
