import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { twMerge } from 'tailwind-merge';
import { getTemplateNode } from '../templateNode';
import { EditorAttributes } from '/common/constants';
import { InsertPos } from '/common/models';
import { CodeDiffRequest } from '/common/models/code';
import {
    DomActionElement,
    DomActionType,
    InsertedElement,
    MovedElementWithTemplate,
} from '/common/models/element/domAction';
import { TemplateNode } from '/common/models/element/templateNode';
import { assertNever } from '/common/helpers';

export function transformAst(
    ast: t.File,
    filepath: string,
    templateToCodeDiff: Map<TemplateNode, CodeDiffRequest>,
): void {
    const hashedTemplateToCodeDiff = createHashedTemplateToCodeDiff(templateToCodeDiff);
    traverse(ast, {
        JSXElement(path) {
            const currentTemplate = getTemplateNode(path.node, filepath, 1);
            const hashedKey = hashTemplateNode(currentTemplate);
            const codeDiffRequest = hashedTemplateToCodeDiff.get(hashedKey);

            if (codeDiffRequest) {
                if (codeDiffRequest.attributes && codeDiffRequest.attributes.className) {
                    if (codeDiffRequest.overrideClasses) {
                        replaceNodeClasses(path.node, codeDiffRequest.attributes.className);
                    } else {
                        addClassToNode(path.node, codeDiffRequest.attributes.className);
                    }
                }
                if (codeDiffRequest.textContent !== undefined) {
                    updateNodeTextContent(path.node, codeDiffRequest.textContent);
                }
                const structureChangeElements = [
                    ...codeDiffRequest.insertedElements,
                    ...codeDiffRequest.movedElements,
                    ...codeDiffRequest.removedElements,
                ];
                applyStructureChanges(path, filepath, structureChangeElements);
            }
        },
    });
}

function createHashedTemplateToCodeDiff(
    templateToCodeDiff: Map<TemplateNode, CodeDiffRequest>,
): Map<string, CodeDiffRequest> {
    const hashedTemplateToCodeDiff = new Map<string, CodeDiffRequest>();
    for (const [templateNode, codeDiffRequest] of templateToCodeDiff) {
        const hashedKey = hashTemplateNode(templateNode);
        hashedTemplateToCodeDiff.set(hashedKey, codeDiffRequest);
    }
    return hashedTemplateToCodeDiff;
}

function hashTemplateNode(node: TemplateNode): string {
    return `${node.path}:${node.startTag.start.line}:${node.startTag.start.column}:${node.startTag.end.line}:${node.startTag.end.column}`;
}

function applyStructureChanges(
    path: NodePath<t.JSXElement>,
    filepath: string,
    elements: DomActionElement[],
): void {
    for (const element of elements) {
        switch (element.type) {
            case DomActionType.MOVE:
                moveElementInNode(path, filepath, element as MovedElementWithTemplate);
                break;
            case DomActionType.INSERT:
                insertElementToNode(path, element as InsertedElement);
                break;
            case DomActionType.REMOVE:
                console.log('Remove', element);
                removeElementFromNode(path, element);
                break;
            default:
                assertNever(element);
        }
    }
}

function insertElementToNode(path: NodePath<t.JSXElement>, element: InsertedElement): void {
    const newElement = createJSXElement(element);

    switch (element.location.position) {
        case InsertPos.APPEND:
            path.node.children.push(newElement);
            break;
        case InsertPos.PREPEND:
            path.node.children.unshift(newElement);
            break;
        case InsertPos.INDEX:
            // Note: children includes non-JSXElement which our index does not account for. We need to find the JSXElement/JSXFragment-only index.
            if (element.location.index !== undefined) {
                const jsxElements = path.node.children.filter(
                    (child) => t.isJSXElement(child) || t.isJSXFragment(child),
                ) as t.JSXElement[];

                const targetIndex = Math.min(element.location.index, jsxElements.length);

                if (targetIndex === path.node.children.length) {
                    path.node.children.push(newElement);
                } else {
                    const targetChild = jsxElements[targetIndex];
                    const targetChildIndex = path.node.children.indexOf(targetChild);
                    path.node.children.splice(targetChildIndex, 0, newElement);
                }
            } else {
                console.error('Invalid index: undefined');
                path.node.children.push(newElement);
            }
            break;
        default:
            console.error(`Unhandled position: ${element.location.position}`);
            path.node.children.push(newElement);
            break;
    }

    path.stop();
}

function removeElementFromNode(path: NodePath<t.JSXElement>, element: DomActionElement): void {
    const children = path.node.children;
    const jsxElements = children.filter(
        (child) => t.isJSXElement(child) || t.isJSXFragment(child),
    ) as Array<t.JSXElement | t.JSXFragment>;

    console.log('Remove', jsxElements);

    let elementToRemoveIndex: number;

    switch (element.location.position) {
        case InsertPos.INDEX:
            if (element.location.index !== undefined) {
                elementToRemoveIndex = Math.min(element.location.index, jsxElements.length - 1);
            } else {
                console.error('Invalid index: undefined');
                return;
            }
            break;
        case InsertPos.APPEND:
            elementToRemoveIndex = jsxElements.length - 1;
            break;
        case InsertPos.PREPEND:
            elementToRemoveIndex = 0;
            break;
        default:
            console.error(`Unhandled position: ${element.location.position}`);
            return;
    }

    if (elementToRemoveIndex >= 0 && elementToRemoveIndex < jsxElements.length) {
        const elementToRemove = jsxElements[elementToRemoveIndex];
        const indexInChildren = children.indexOf(elementToRemove);

        if (indexInChildren !== -1) {
            children.splice(indexInChildren, 1);
        } else {
            console.error('Element to be removed not found in children');
        }
    } else {
        console.error('Invalid element index for removal');
    }

    path.stop();
}

function createJSXElement(insertedChild: InsertedElement): t.JSXElement {
    const attributes = Object.entries(insertedChild.attributes || {}).map(([key, value]) =>
        t.jsxAttribute(
            t.jsxIdentifier(key),
            typeof value === 'string'
                ? t.stringLiteral(value)
                : t.jsxExpressionContainer(t.stringLiteral(JSON.stringify(value))),
        ),
    );

    const isSelfClosing = ['img', 'input', 'br', 'hr', 'meta', 'link'].includes(
        insertedChild.tagName.toLowerCase(),
    );

    const openingElement = t.jsxOpeningElement(
        t.jsxIdentifier(insertedChild.tagName),
        attributes,
        isSelfClosing,
    );

    let closingElement = null;
    if (!isSelfClosing) {
        closingElement = t.jsxClosingElement(t.jsxIdentifier(insertedChild.tagName));
    }

    const children: Array<t.JSXElement | t.JSXExpressionContainer | t.JSXText> = [];

    // Add textContent as the first child if it exists
    if (insertedChild.textContent) {
        children.push(t.jsxText(insertedChild.textContent));
    }

    // Add other children after the textContent
    children.push(...(insertedChild.children || []).map(createJSXElement));

    return t.jsxElement(openingElement, closingElement, children, isSelfClosing);
}

function addClassToNode(node: t.JSXElement, className: string): void {
    const openingElement = node.openingElement;
    const classNameAttr = openingElement.attributes.find(
        (attr) => t.isJSXAttribute(attr) && attr.name.name === 'className',
    ) as t.JSXAttribute | undefined;

    if (classNameAttr) {
        if (t.isStringLiteral(classNameAttr.value)) {
            classNameAttr.value.value = twMerge(classNameAttr.value.value, className);
        } else if (
            t.isJSXExpressionContainer(classNameAttr.value) &&
            t.isCallExpression(classNameAttr.value.expression)
        ) {
            classNameAttr.value.expression.arguments.push(t.stringLiteral(className));
        }
    } else {
        const newClassNameAttr = t.jsxAttribute(
            t.jsxIdentifier('className'),
            t.stringLiteral(className),
        );
        openingElement.attributes.push(newClassNameAttr);
    }
}

function replaceNodeClasses(node: t.JSXElement, className: string): void {
    const openingElement = node.openingElement;
    const classNameAttr = openingElement.attributes.find(
        (attr) => t.isJSXAttribute(attr) && attr.name.name === 'className',
    ) as t.JSXAttribute | undefined;

    if (classNameAttr) {
        classNameAttr.value = t.stringLiteral(className);
    }
}

function moveElementInNode(
    path: NodePath<t.JSXElement>,
    filepath: string,
    element: MovedElementWithTemplate,
): void {
    // Note: children includes non-JSXElement which our index does not account for. We need to find the JSXElement/JSXFragment-only index.
    const children = path.node.children;
    const elementToMoveIndex = children.findIndex((child) => {
        if (t.isJSXElement(child)) {
            const childTemplate = getTemplateNode(child, filepath, 1);
            const hashChild = hashTemplateNode(childTemplate);
            const hashElement = hashTemplateNode(element.templateNode);
            return hashChild === hashElement;
        }
        return false;
    });

    if (elementToMoveIndex !== -1) {
        const [elementToMove] = children.splice(elementToMoveIndex, 1);
        addMoveKeyToElement(elementToMove as t.JSXElement);
        const jsxElements = children.filter(
            (child) => t.isJSXElement(child) || t.isJSXFragment(child) || child === elementToMove,
        ) as t.JSXElement[];

        const targetIndex = Math.min(element.location.index, jsxElements.length);

        if (targetIndex === jsxElements.length) {
            children.push(elementToMove);
        } else {
            const targetChild = jsxElements[targetIndex];
            const targetChildIndex = children.indexOf(targetChild);
            children.splice(targetChildIndex, 0, elementToMove);
        }
    } else {
        console.error('Element to be moved not found');
    }
}

function addMoveKeyToElement(element: t.JSXElement): void {
    if (t.isJSXElement(element)) {
        const keyExists =
            element.openingElement.attributes.findIndex(
                (attr) => t.isJSXAttribute(attr) && attr.name.name === 'key',
            ) !== -1;
        if (!keyExists) {
            const key = EditorAttributes.ONLOOK_MOVE_KEY_PREFIX + Date.now().toString();
            const keyAttribute = t.jsxAttribute(t.jsxIdentifier('key'), t.stringLiteral(key));
            element.openingElement.attributes.push(keyAttribute);
        }
    }
}

function updateNodeTextContent(node: t.JSXElement, textContent: string): void {
    const textNode = node.children.find((child) => t.isJSXText(child)) as t.JSXText | undefined;
    if (textNode) {
        textNode.value = textContent;
    } else {
        node.children.unshift(t.jsxText(textContent));
    }
}
