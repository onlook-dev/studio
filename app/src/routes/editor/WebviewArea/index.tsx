import { useEditorEngine } from '@/components/Context';
import { WebviewMessageBridge } from '@/lib/editor/messageBridge';
import { observer } from 'mobx-react-lite';
import { CodeEditor } from './CodeEditor';
import Frame from './Frame';
import Overlay from './Overlay';

const WebviewArea = observer(() => {
    const editorEngine = useEditorEngine();
    const messageBridge = new WebviewMessageBridge(editorEngine);
    return (
        <Overlay>
            <div className="grid grid-flow-col gap-72">
                {editorEngine.canvas.frames.map((settings, index) => (
                    <Frame key={index} settings={settings} messageBridge={messageBridge} />
                ))}
            </div>
            <CodeEditor />
        </Overlay>
    );
});

export default WebviewArea;
