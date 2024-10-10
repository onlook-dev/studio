import { CssToTailwindTranslator } from 'css-to-tailwind-translator';
import { twMerge } from 'tailwind-merge';
import { CodeDiffRequest } from '/common/models/code';
import { TemplateNode } from '/common/models/element/templateNode';

export async function getOrCreateCodeDiffRequest(
    templateNode: TemplateNode,
    selector: string,
    templateToCodeChange: Map<TemplateNode, CodeDiffRequest>,
): Promise<CodeDiffRequest> {
    let diffRequest = templateToCodeChange.get(templateNode);
    if (!diffRequest) {
        diffRequest = {
            selector,
            templateNode,
            insertedElements: [],
            movedElements: [],
            removedElements: [],
            attributes: {},
        };
        templateToCodeChange.set(templateNode, diffRequest);
    }
    return diffRequest;
}

export function getTailwindClassChangeFromStyle(
    request: CodeDiffRequest,
    styles: Record<string, string>,
): void {
    const newClasses = getCssClasses(request.selector, styles);
    request.attributes['className'] = twMerge(request.attributes['className'] || '', newClasses);
}

export function getCssClasses(selector: string, styles: Record<string, string>) {
    const css = createCSSRuleString(selector, styles);
    const tw = CssToTailwindTranslator(css);
    return tw.data.map((res) => res.resultVal);
}

export function createCSSRuleString(selector: string, styles: Record<string, string>) {
    const cssString = Object.entries(styles)
        .map(
            ([property, value]) =>
                `${property.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`,
        )
        .join(' ');
    return `${selector} { ${cssString} }`;
}
