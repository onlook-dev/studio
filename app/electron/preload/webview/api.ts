import { contextBridge } from 'electron';
import { processDom } from './dom';
import { getElementAtLoc, getElementWithSelector } from './elements';
import { copyElementBySelector } from './elements/copy';
import { isElementInserted } from './elements/helpers';
import { getInsertedElements, getInsertLocation } from './elements/insert';
import { getElementIndex, getMovedElements } from './elements/move';
import { drag, endDrag, startDrag } from './elements/move/drag';
import { getRemoveActionFromSelector } from './elements/remove';
import { getComputedStyleBySelector } from './elements/style';
import {
    editText,
    getTextEditedElements,
    startEditingText,
    stopEditingText,
} from './elements/text';
import { getTheme, toggleTheme } from './theme';

export function setApi() {
    contextBridge.exposeInMainWorld('api', {
        getElementAtLoc: getElementAtLoc,
        getElementWithSelector: getElementWithSelector,
        processDom: processDom,
        isElementInserted: isElementInserted,
        getComputedStyleBySelector: getComputedStyleBySelector,

        // Theme
        getTheme: getTheme,
        toggleTheme: toggleTheme,

        // Insert
        getInsertLocation: getInsertLocation,
        getInsertedElements: getInsertedElements,
        getRemoveActionFromSelector: getRemoveActionFromSelector,

        // Copy
        copyElementBySelector: copyElementBySelector,

        // Drag
        startDrag: startDrag,
        drag: drag,
        endDrag: endDrag,
        getMovedElements: getMovedElements,
        getElementIndex: getElementIndex,

        // Edit text
        startEditingText: startEditingText,
        editText: editText,
        stopEditingText: stopEditingText,
        getTextEditedElements: getTextEditedElements,
    });
}
