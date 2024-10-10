import generate, { GeneratorOptions } from '@babel/generator';
import * as t from '@babel/types';
import { readFile } from '../files';
import { parseJsx, removeSemiColonIfApplicable } from '../helpers';
import { transformAst } from './transform';
import { CodeDiff, CodeDiffRequest } from '/common/models/code';
import { TemplateNode } from '/common/models/element/templateNode';

interface RequestsByPath {
    templateToCodeDiff: Map<TemplateNode, CodeDiffRequest>;
    codeBlock: string;
}

export async function getCodeDiffs(requests: CodeDiffRequest[]): Promise<CodeDiff[]> {
    const groupedRequests = await groupRequestsByTemplatePath(requests);
    return processGroupedRequests(groupedRequests);
}

async function groupRequestsByTemplatePath(
    requests: CodeDiffRequest[],
): Promise<Map<string, RequestsByPath>> {
    const groupedRequests: Map<string, RequestsByPath> = new Map();

    for (const request of requests) {
        const codeBlock = await readFile(request.templateNode.path);
        const path = request.templateNode.path;

        let groupedRequest = groupedRequests.get(path);
        if (!groupedRequest) {
            groupedRequest = { templateToCodeDiff: new Map(), codeBlock };
        }
        groupedRequest.templateToCodeDiff.set(request.templateNode, request);
        groupedRequests.set(path, groupedRequest);
    }

    return groupedRequests;
}

function processGroupedRequests(groupedRequests: Map<string, RequestsByPath>): CodeDiff[] {
    const diffs: CodeDiff[] = [];
    const generateOptions: GeneratorOptions = { retainLines: true, compact: false };

    for (const [path, request] of groupedRequests) {
        const { templateToCodeDiff, codeBlock } = request;
        const ast = parseJsx(codeBlock);
        if (!ast) {
            continue;
        }

        const original = generateCode(ast, generateOptions, codeBlock);
        transformAst(ast, path, templateToCodeDiff);
        const generated = generateCode(ast, generateOptions, codeBlock);
        diffs.push({ original, generated, path });
    }
    return diffs;
}

export function generateCode(ast: t.File, options: GeneratorOptions, codeBlock: string): string {
    return removeSemiColonIfApplicable(generate(ast, options, codeBlock).code, codeBlock);
}
