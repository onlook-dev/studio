import { InsertedElement, MovedElementWithTemplate } from './element/domAction';
import { TemplateNode } from './element/templateNode';

export interface CodeDiffRequest {
    selector: string;
    templateNode: TemplateNode;
    insertedElements: InsertedElement[];
    movedElements: MovedElementWithTemplate[];
    attributes: Record<string, string>;
    textContent?: string;
    overrideClasses?: boolean;
}

export interface CodeDiff {
    original: string;
    generated: string;
    path: string;
}
