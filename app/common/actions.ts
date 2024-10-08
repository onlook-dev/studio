import { InsertPos } from './models';
import { CopiedElement } from './models/element/domAction';

export interface Change<T> {
    updated: T;
    original: T;
}

export interface ActionTarget {
    webviewId: string;
}

export interface ActionTargetWithSelector extends ActionTarget {
    selector: string;
}

export interface StyleActionTarget extends ActionTargetWithSelector {
    change: Change<string>;
}

export interface ActionElementLocation {
    position: InsertPos;
    targetSelector: string;
    index?: number;
}

export interface ActionElement {
    tagName: string;
    attributes: Record<string, string>;
    children: ActionElement[];
    textContent: string;
}

export interface UpdateStyleAction {
    type: 'update-style';
    targets: Array<StyleActionTarget>;
    style: string;
}

export interface InsertElementAction {
    type: 'insert-element';
    targets: Array<ActionTarget>;
    location: ActionElementLocation;
    element: ActionElement;
    styles: Record<string, string>;
    editText?: boolean;
}

export interface RemoveElementAction {
    type: 'remove-element';
    targets: Array<ActionTarget>;
    location: ActionElementLocation;
    element: ActionElement;
    styles: Record<string, string>;
}

export interface MoveElementAction {
    type: 'move-element';
    targets: Array<ActionTargetWithSelector>;
    originalIndex: number;
    newIndex: number;
}

export interface EditTextAction {
    type: 'edit-text';
    targets: Array<ActionTargetWithSelector>;
    originalContent: string;
    newContent: string;
}

export interface PasteElementAction {
    type: 'paste-element';
    targets: Array<ActionTargetWithSelector>;
    location: ActionElementLocation;
    elements: CopiedElement[];
}

export type Action =
    | UpdateStyleAction
    | InsertElementAction
    | RemoveElementAction
    | MoveElementAction
    | EditTextAction
    | PasteElementAction;
