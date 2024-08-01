import traverse from '@babel/traverse';
import t from '@babel/types';
import { readCodeBlock } from '.';
import { parseJsx } from './babel';
import { TemplateNode, TemplateTag } from '/common/models/element/templateNode';

export async function getTemplateNodeChild(
    parent: TemplateNode,
    child: TemplateNode,
): Promise<TemplateNode | undefined> {
    const codeBlock = await readCodeBlock(parent);
    const ast = parseJsx(codeBlock);
    if (!ast) {
        return;
    }

    let instance: TemplateNode | undefined;
    traverse(ast, {
        JSXElement(path) {
            if (!path) {
                return;
            }
            const node = path.node;
            const childName = (node.openingElement.name as t.JSXIdentifier).name;
            if (childName === child.component) {
                instance = getTemplateNode(node, parent.path, parent.startTag.start.line);
                path.stop();
            }
        },
    });
    return instance;
}

function getTemplateNode(node: t.JSXElement, path: string, lineOffset: number): TemplateNode {
    if (!node.openingElement.loc) {
        throw new Error('No location found for opening element');
    }

    const name = (node.openingElement.name as t.JSXIdentifier).name;
    const startTag: TemplateTag = getTemplateTag(node.openingElement, lineOffset);
    const endTag: TemplateTag = node.closingElement
        ? getTemplateTag(node.closingElement, lineOffset)
        : startTag;

    const template: TemplateNode = {
        path,
        startTag,
        endTag,
        component: name,
    };
    return template;
}

function getTemplateTag(
    element: t.JSXOpeningElement | t.JSXClosingElement,
    lineOffset: number,
): TemplateTag {
    if (!element.loc) {
        throw new Error('No location found for element');
    }

    return {
        start: {
            line: element.loc.start.line + lineOffset - 1,
            column: element.loc.start.column + 1,
        },
        end: {
            line: element.loc.end.line + lineOffset - 1,
            column: element.loc.end.column + 1,
        },
    };
}
