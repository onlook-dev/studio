import { useEditorEngine } from '@/components/Context';
import { Textarea } from '@/components/ui/textarea';
import { sendAnalytics } from '@/lib/utils';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { MainChannels } from '/common/constants';
import { CodeDiffRequest } from '/common/models/code';
import { TemplateNode } from '/common/models/element/templateNode';

const TailwindInput = observer(() => {
    const editorEngine = useEditorEngine();
    const [instance, setInstance] = useState<TemplateNode | null>(null);
    const [root, setRoot] = useState<TemplateNode | null>(null);
    const [instanceClasses, setInstanceClasses] = useState<string>('');
    const [rootClasses, setRootClasses] = useState<string>('');

    useEffect(() => {
        if (editorEngine.elements.selected.length) {
            const selectedEl = editorEngine.elements.selected[0];
            getInstanceClasses(selectedEl.selector);
            getRootClasses(selectedEl.selector);
        }
    }, [editorEngine.elements.selected]);

    async function getInstanceClasses(selector: string) {
        const instance = editorEngine.ast.getInstance(selector);
        setInstance(instance || null);
        if (instance) {
            const instanceClasses: string[] = await window.api.invoke(
                MainChannels.GET_TEMPLATE_NODE_CLASS,
                instance,
            );
            setInstanceClasses(instanceClasses.join(' '));
        }
    }

    async function getRootClasses(selector: string) {
        const root = editorEngine.ast.getRoot(selector);
        setRoot(root || null);
        if (root) {
            const rootClasses: string[] = await window.api.invoke(
                MainChannels.GET_TEMPLATE_NODE_CLASS,
                root,
            );
            setRootClasses(rootClasses.join(' '));
        }
    }

    const createCodeDiffRequest = async (templateNode: TemplateNode, className: string) => {
        const request: CodeDiffRequest = {
            templateNode,
            selector: editorEngine.elements.selected[0].selector,
            attributes: { className },
            insertedElements: [],
            movedElements: [],
            removedElements: [],
            overrideClasses: true,
        };
        const codeDiffs = await editorEngine.code.getCodeDiff([request]);
        const res = await window.api.invoke(MainChannels.WRITE_CODE_BLOCKS, codeDiffs);

        if (res) {
            editorEngine.webviews.getAll().forEach((webview) => {
                webview.executeJavaScript(`window.api?.processDom()`);
            });

            setTimeout(() => {
                const instance = editorEngine.ast.getInstance(
                    editorEngine.elements.selected[0].selector,
                );
                setInstance(instance || null);
                const root = editorEngine.ast.getRoot(editorEngine.elements.selected[0].selector);
                setRoot(root || null);
            }, 1000);

            sendAnalytics('tailwind action');
        }
    };

    function handleKeyDown(e: any) {
        if (e.key === 'Enter' || e.key === 'Tab' || e.key === 'Escape') {
            e.target.blur();
            e.preventDefault();
        }
    }

    return (
        <div className="flex flex-col gap-2 text-xs text-text">
            {instance && <p>Instance</p>}
            {instance && (
                <Textarea
                    className="w-full text-xs text-text-active break-normal bg-bg/75 focus-visible:ring-0"
                    placeholder="Add tailwind classes here"
                    value={instanceClasses}
                    onInput={(e: any) => setInstanceClasses(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={(e) => instance && createCodeDiffRequest(instance, e.target.value)}
                />
            )}

            {instance && root && <p>Component</p>}
            {root && (
                <Textarea
                    className="w-full text-xs text-text-active break-normal bg-bg/75 focus-visible:ring-0"
                    placeholder="Add tailwind classes here"
                    value={rootClasses}
                    onInput={(e: any) => setRootClasses(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={(e) => root && createCodeDiffRequest(root, e.target.value)}
                />
            )}
        </div>
    );
});

export default TailwindInput;
