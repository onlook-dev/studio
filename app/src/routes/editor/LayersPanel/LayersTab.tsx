import { useEditorEngine } from '@/components/Context';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import { NodeApi, Tree, TreeApi } from 'react-arborist';
import useResizeObserver from 'use-resize-observer';
import RightClickMenu from '../RightClickMenu';
import TreeNode from './Tree/TreeNode';
import TreeRow from './Tree/TreeRow';
import { escapeSelector } from '/common/helpers';
import { LayerNode } from '/common/models/element/layers';

const LayersTab = observer(() => {
    const treeRef = useRef<TreeApi<LayerNode>>();
    const editorEngine = useEditorEngine();
    const [domTree, setDomTree] = useState<LayerNode[]>(editorEngine.ast.layers);
    const [treeHovered, setTreeHovered] = useState(false);
    const { ref, width, height } = useResizeObserver();

    useEffect(() => setDomTree(editorEngine.ast.layers), [editorEngine.ast.layers]);
    useEffect(handleSelectChange, [editorEngine.elements.selected]);

    function handleMouseLeaveTree() {
        setTreeHovered(false);
        editorEngine.overlay.removeHoverRect();
    }

    function handleSelectChange() {
        if (editorEngine.elements.selected.length > 0) {
            treeRef.current?.scrollTo(editorEngine.elements.selected[0].selector);
        }
    }

    async function handleDragEnd({
        dragIds,
        parentId,
        index,
    }: {
        dragIds: string[];
        parentId: string | null;
        index: number;
    }) {
        const webview = editorEngine.webviews.getWebview(
            editorEngine.elements.selected[0].webviewId,
        );
        if (!webview) {
            console.error('No webview found');
            return;
        }
        const originalIndex = (await webview.executeJavaScript(
            `window.api?.getElementIndex('${escapeSelector(dragIds[0])}')`,
        )) as number | undefined;
        if (!originalIndex) {
            console.error('No original index found');
            return;
        }
        if (originalIndex === index) {
            console.log('No index change');
            return;
        }
        const moveAction = editorEngine.move.createMoveAction(
            dragIds[0],
            originalIndex,
            index,
            webview.id,
        );
        editorEngine.action.run(moveAction);
    }

    function disableDrop({
        parentNode,
        dragNodes,
        index,
    }: {
        parentNode: NodeApi<LayerNode> | null;
        dragNodes: NodeApi<LayerNode>[];
        index: number;
    }) {
        return !dragNodes.every((node) => node?.parent?.id === parentNode?.id);
    }

    return (
        <div
            ref={ref}
            className="flex h-[calc(93vh-5.25rem)] text-xs text-active flex-grow min-w-fit"
            onMouseOver={() => setTreeHovered(true)}
            onMouseLeave={() => handleMouseLeaveTree()}
        >
            <RightClickMenu>
                <Tree
                    ref={treeRef}
                    data={domTree}
                    openByDefault={true}
                    overscanCount={1}
                    indent={8}
                    padding={0}
                    rowHeight={24}
                    height={(height ?? 8) - 16}
                    width={width ?? 365}
                    renderRow={TreeRow as any}
                    onMove={handleDragEnd}
                    disableDrop={disableDrop}
                >
                    {(props) => <TreeNode {...props} treeHovered={treeHovered} />}
                </Tree>
            </RightClickMenu>
        </div>
    );
});

export default LayersTab;
