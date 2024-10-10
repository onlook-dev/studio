import { twMerge } from 'tailwind-merge';
import { getCssClasses } from './helpers';
import { ActionElement, ActionElementLocation } from '/common/actions';
import { DomActionType, InsertedElement, RemovedElement } from '/common/models/element/domAction';

export function getInsertedElement(
    actionElement: ActionElement,
    location: ActionElementLocation,
    styles: Record<string, string>,
): InsertedElement {
    const insertedElement: InsertedElement = {
        type: DomActionType.INSERT,
        tagName: actionElement.tagName,
        children: [],
        attributes: { className: actionElement.attributes['className'] || '' },
        textContent: actionElement.textContent,
        location,
    };

    // Update classname from style
    const newClasses = getCssClasses(insertedElement.location.targetSelector, styles);
    insertedElement.attributes['className'] = twMerge(
        insertedElement.attributes['className'] || '',
        newClasses,
    );

    if (actionElement.children) {
        insertedElement.children = actionElement.children.map((child) =>
            getInsertedElement(child, location, styles),
        );
    }
    return insertedElement;
}

export function getRemovedElement(location: ActionElementLocation): RemovedElement {
    const removedElement: RemovedElement = {
        type: DomActionType.REMOVE,
        location,
    };
    return removedElement;
}
