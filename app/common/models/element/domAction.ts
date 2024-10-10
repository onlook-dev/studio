import { InsertPos } from '..';
import { TemplateNode } from './templateNode';
import { ActionElementLocation, MoveActionLocation } from '/common/actions';

export enum DomActionType {
    MOVE = 'move-element',
    INSERT = 'insert-element',
    REMOVE = 'remove-element',
}

interface BaseActionElement {
    type: DomActionType;
    location: ActionElementLocation;
}

export interface ActionMoveLocation extends ActionElementLocation {
    position: InsertPos.INDEX;
    targetSelector: string;
    index: number;
}

export interface MovedElement extends BaseActionElement {
    selector: string;
    type: DomActionType.MOVE;
    location: MoveActionLocation;
}

export interface MovedElementWithTemplate extends MovedElement {
    templateNode: TemplateNode;
}

export interface TextEditedElement {
    selector: string;
    content: string;
}

export interface InsertedElement extends BaseActionElement {
    type: DomActionType.INSERT;
    tagName: string;
    children: InsertedElement[];
    attributes: Record<string, string>;
    textContent?: string;
    codeBlock?: string;
}

export interface RemovedElement extends BaseActionElement {
    type: DomActionType.REMOVE;
    codeBlock?: string;
}

export interface StyleChange {
    selector: string;
    styles: Record<string, string>;
}

export type DomActionElement = MovedElement | InsertedElement | RemovedElement;
