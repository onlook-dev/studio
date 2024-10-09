import { useState } from 'react';
import Canvas from './Canvas';
import EditPanel from './EditPanel';
import LayersPanel from './LayersPanel';
import ResizablePanel from './LayersPanel/ResizablePanel';
import ThemingPanel from './ThemingPanel';
import Toolbar from './Toolbar';
import EditorTopBar from './TopBar';
import WebviewArea from './WebviewArea';

function ProjectEditor() {
    const [openPanels, setOpenPanels] = useState<('layers' | 'theming')[]>(['layers']);

    return (
        <>
            <div className="relative flex flex-row h-[calc(100vh-2.5rem)] select-none">
                <Canvas>
                    <WebviewArea />
                </Canvas>
                <ResizablePanel>
                    <div className="left-0 animate-layer-panel-in">
                        <LayersPanel openPanels={openPanels} setOpenPanels={setOpenPanels} />
                    </div>
                    <div className="left-0 mt-2 animate-layer-panel-in">
                        <ThemingPanel openPanels={openPanels} setOpenPanels={setOpenPanels} />
                    </div>
                </ResizablePanel>
                <div className="fixed right-0 top-20 animate-edit-panel-in">
                    <EditPanel />
                </div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-toolbar-up">
                    <Toolbar />
                </div>
                <div className="absolute top-0 w-full">
                    <EditorTopBar />
                </div>
            </div>
        </>
    );
}

export default ProjectEditor;
