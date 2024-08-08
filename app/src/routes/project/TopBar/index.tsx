import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { sendAnalytics } from '@/lib/utils';
import { Component1Icon, FrameIcon, ResetIcon } from '@radix-ui/react-icons';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useEditorEngine } from '..';
import ModeToggle from './ModeToggle';
import PublishModal from './PublishModal';
import { WebViewElement } from '/common/models/element';
import { TemplateNode } from '/common/models/element/templateNode';

const EditorTopBar = observer(() => {
    const editorEngine = useEditorEngine();
    const [instance, setInstance] = useState<TemplateNode | undefined>();
    const [root, setRoot] = useState<TemplateNode | undefined>();

    useEffect(() => {
        if (editorEngine.elements.selected.length > 0) {
            const element: WebViewElement = editorEngine.elements.selected[0];
            editorEngine.ast.getInstance(element.selector).then((instance) => {
                setInstance(instance);
            });
            editorEngine.ast.getRoot(element.selector).then((root) => {
                setRoot(root);
            });
        }
    }, [editorEngine.elements.selected]);

    function viewSource(templateNode?: TemplateNode) {
        if (templateNode) {
            editorEngine.code.viewSource(templateNode);
            sendAnalytics('view source code');
        }
    }

    function onUndoClick() {
        editorEngine.action.undo();
        sendAnalytics('undo');
    }

    function onRedoClick() {
        editorEngine.action.redo();
        sendAnalytics('redo');
    }

    function renderButton(disableClick = false) {
        return (
            <Button
                disabled={!instance && !root}
                variant="outline"
                size="sm"
                className=""
                onClick={() => !disableClick && viewSource(instance || root)}
            >
                <div className="text-default h-3 w-3 mr-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0,0,256,256">
                        <g fill="#ffffff">
                            <g transform="scale(10.66667,10.66667)">
                                <path d="M22,4.94v14.09c0,0 -2.69,1.3 -4,1.93v-17.93c1.42,0.68 4,1.91 4,1.91zM4.65,13.35l2.16,1.97c-0.97,0.73 -1.77,1.34 -2.26,1.7l-2.11,-1.65zM16,3.02v5.32c0,0 -1.36,1.04 -3.17,2.41c-0.94,-0.72 -1.94,-1.48 -2.9,-2.2l5.94,-5.41zM16,20.983v-5.323c0,0 -9.202,-6.994 -11.453,-8.681l-2.103,1.652z"></path>
                            </g>
                        </g>
                    </svg>
                </div>
                Open in VSCode
            </Button>
        );
    }

    return (
        <div className="bg-bg/10 backdrop-blur-sm flex flex-row h-10 p-2 justify-center items-center">
            <div className="flex flex-row flex-grow basis-0 space-x-1 justify-start items-center">
                <DropdownMenu>
                    {instance ? (
                        <DropdownMenuTrigger asChild>{renderButton(true)}</DropdownMenuTrigger>
                    ) : (
                        renderButton()
                    )}
                    <DropdownMenuContent>
                        <DropdownMenuItem
                            className="text-xs"
                            onSelect={() => {
                                viewSource(instance);
                            }}
                        >
                            <FrameIcon className="mr-2 w-3 h-3" />
                            Instance
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-xs"
                            onSelect={() => {
                                viewSource(root);
                            }}
                        >
                            <Component1Icon className="mr-2 w-3 h-3" /> Root
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button
                    variant="ghost"
                    size="sm"
                    className="p-1"
                    onClick={onUndoClick}
                    disabled={!editorEngine.history.canUndo}
                >
                    <ResetIcon className="h-3 w-3 mr-1" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="p-1"
                    onClick={onRedoClick}
                    disabled={!editorEngine.history.canRedo}
                >
                    <ResetIcon className="h-3 w-3 mr-1 scale-x-[-1]" />
                </Button>
                <p className="text-xs text-text">
                    {editorEngine.history.length === 0
                        ? ''
                        : `${editorEngine.history.length} change${editorEngine.history.length > 1 ? 's' : ''}`}
                </p>
            </div>
            <div className="-mt-2">
                <ModeToggle />
            </div>
            <div className="flex space-x-2 flex-grow basis-0 justify-end">
                <PublishModal />
            </div>
        </div>
    );
});

export default EditorTopBar;
