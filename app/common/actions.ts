export interface Change<T> {
    updated: T;
    original: T;
}

export interface ActionTarget {
    webviewId: string;
    selector: string;
}

export interface UpdateStyleAction {
    type: 'update-style';
    targets: Array<ActionTarget>;
    style: string;
    change: Change<string>;
}

export interface ElementChange {
    element: string;
}

export interface InsertElementAction {
    type: 'insert-element';
    targets: Array<ActionTarget>;
    position: 'before' | 'after' | 'prepend' | 'append' | number;
    element: string;
}

export interface RemoveElementAction {
    type: 'remove-element';
    targets: Array<ActionTarget>;
    position: 'before' | 'after' | 'prepend' | 'append' | number;
    element: string;
}

export type Action = UpdateStyleAction | InsertElementAction | RemoveElementAction;
