import { ChevronRightIcon } from '@radix-ui/react-icons';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import { NodeApi, Tree, TreeApi } from 'react-arborist';
import { useEditorEngine } from '..';
import NodeIcon from './NodeIcon';
import { escapeSelector } from '/common/helpers';
import { MouseAction } from '/common/models';
import { DomElement, WebViewElement } from '/common/models/element';

export const IGNORE_TAGS = ['SCRIPT', 'STYLE'];

export interface LayerNode {
    id: string;
    name: string;
    children?: LayerNode[];
    type: number;
    component: boolean;
    tagName: string;
    style: {
        display: string;
        flexDirection: string;
    };
}

const LayersTab = observer(() => {
    const treeRef = useRef();
    const editorEngine = useEditorEngine();
    const panelRef = useRef<HTMLDivElement>(null);
    const [domTree, setDomTree] = useState<LayerNode[]>([]);
    const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
    const [hoveredNodeId, setHoveredNodeId] = useState<string | undefined>();
    const [treeHovered, setTreeHovered] = useState(false);

    useEffect(() => {
        setDomTree(editorEngine.ast.layers);
    }, [editorEngine.ast.layers]);

    useEffect(handleHoverStateChange, [editorEngine.elements.hovered]);
    useEffect(handleSelectStateChange, [editorEngine.elements.selected]);

    function handleSelectStateChange() {
        const tree = treeRef.current as TreeApi<LayerNode> | undefined;
        if (!tree) {
            return;
        }

        if (!editorEngine.elements.selected.length) {
            tree.deselectAll();
            setSelectedNodes([]);
            return;
        }

        const selectors = editorEngine.elements.selected.map((node) => node.selector);

        let firstSelect = true;
        for (const selector of selectors) {
            firstSelect ? tree.select(selector) : tree.selectMulti(selector);
            firstSelect = false;
        }

        setSelectedNodes(selectors);
    }

    function handleHoverStateChange() {
        const tree = treeRef.current as TreeApi<LayerNode> | undefined;
        if (!tree) {
            return;
        }

        const selector = editorEngine.elements.hovered?.selector;
        setHoveredNodeId(selector);
    }

    function handleSelectNode(nodes: NodeApi[]) {
        if (!nodes.length) {
            return;
        }
        const selector = nodes[0].id;
        if (!selector || selectedNodes.includes(selector)) {
            return;
        }
        setSelectedNodes([selector]);
        sendMouseEvent(selector, MouseAction.CLICK);
    }

    function handleHoverNode(node: NodeApi) {
        if (hoveredNodeId === node.data.id) {
            return;
        }
        const selector = node?.data.id;
        if (!selector) {
            return;
        }
        setHoveredNodeId(node.data.id);
        sendMouseEvent(selector, MouseAction.MOVE);
    }

    function handleMouseLeaveTree() {
        setTreeHovered(false);
        setHoveredNodeId(undefined);
        editorEngine.overlay.removeHoverRect();
    }

    async function sendMouseEvent(selector: string, action: MouseAction) {
        const webviews = editorEngine.webviews.webviews;
        for (const [webviewId, webviewState] of webviews.entries()) {
            const webviewTag = webviewState.webview;
            const el: DomElement = await webviewTag.executeJavaScript(
                `window.api.getElementWithSelector('${escapeSelector(selector)}')`,
            );
            const webviewEl: WebViewElement = { ...el, webviewId };
            switch (action) {
                case MouseAction.MOVE:
                    editorEngine.elements.mouseover([webviewEl], webviewTag);
                    break;
                case MouseAction.CLICK:
                    editorEngine.elements.click([webviewEl], webviewTag);
                    break;
            }
        }
    }

    function TreeNode({ node, style }: { node: NodeApi; style: React.CSSProperties }) {
        return (
            <div
                style={style}
                onClick={() => node.select()}
                onMouseOver={() => handleHoverNode(node)}
                className={clsx(
                    'flex flex-row items-center h-6 cursor-pointer min-w-full truncate',
                    node.isSelected ? 'bg-bg-active text-white' : '',
                    node.data.id === hoveredNodeId ? 'bg-bg' : '',
                )}
            >
                <span className="w-4 h-4">
                    {!node.isLeaf && (
                        <div
                            className="w-4 h-4 flex items-center justify-center"
                            onClick={() => node.toggle()}
                        >
                            {treeHovered && (
                                <motion.div
                                    initial={false}
                                    animate={{ rotate: node.isOpen ? 90 : 0 }}
                                >
                                    <ChevronRightIcon className="h-2.5 w-2.5" />
                                </motion.div>
                            )}
                        </div>
                    )}
                </span>
                <NodeIcon iconClass="w-3 h-3 ml-1 mr-2" node={node.data} />
                <span className="">{node.data.name}</span>
            </div>
        );
    }

    return (
        <div
            ref={panelRef}
            className="flex h-[calc(100vh-8.25rem)] text-xs text-text"
            onMouseOver={() => setTreeHovered(true)}
            onMouseLeave={() => handleMouseLeaveTree()}
        >
            <Tree
                ref={treeRef}
                data={domTree}
                openByDefault={true}
                overscanCount={1}
                indent={8}
                padding={0}
                rowHeight={24}
                height={(panelRef.current?.clientHeight ?? 8) - 16}
                onSelect={handleSelectNode}
            >
                {TreeNode}
            </Tree>
        </div>
    );
});

export default LayersTab;
