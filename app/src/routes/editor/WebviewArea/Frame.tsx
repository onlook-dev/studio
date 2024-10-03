import { useEditorEngine } from '@/components/Context';
import { Button } from '@/components/ui/button';
import { WebviewMessageBridge } from '@/lib/editor/messageBridge';
import { ExternalLinkIcon } from '@radix-ui/react-icons';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import BrowserControls from './BrowserControl';
import GestureScreen from './GestureScreen';
import ResizeHandles from './ResizeHandles';
import { Links } from '/common/constants';
import { isOnlookInDoc } from '/common/helpers';
import { FrameSettings } from '/common/models/project';
import Canvas from '../Canvas';

const Frame = observer(
    ({
        messageBridge,
        settings,
    }: {
        messageBridge: WebviewMessageBridge;
        settings: FrameSettings;
    }) => {
        const RETRY_TIMEOUT = 3000;
        const editorEngine = useEditorEngine();
        const webviewRef = useRef<Electron.WebviewTag>(null);

        const [selected, setSelected] = useState<boolean>(false);
        const [focused, setFocused] = useState<boolean>(false);
        const [hovered, setHovered] = useState<boolean>(false);
        const [domFailed, setDomFailed] = useState(false);
        const [onlookEnabled, setOnlookEnabled] = useState(false);

        const [webviewSize, setWebviewSize] = useState(settings.dimension);
        const [webviewSrc, setWebviewSrc] = useState<string>(settings.url);

        useEffect(setupFrame, [webviewRef]);
        useEffect(
            () => setSelected(editorEngine.webviews.isSelected(settings.id)),
            [editorEngine.webviews.webviews],
        );

        useEffect(() => {
            editorEngine.canvas.saveFrame(settings.id, {
                url: webviewSrc,
                dimension: webviewSize,
            });
        }, [webviewSize, webviewSrc]);

        function setupFrame() {
            const webview = webviewRef.current as Electron.WebviewTag | null;
            if (!webview) {
                return;
            }
            editorEngine.webviews.register(webview);
            messageBridge.register(webview, settings.id);
            setBrowserEventListeners(webview);

            return () => {
                editorEngine.webviews.deregister(webview);
                messageBridge.deregister(webview);
                webview.removeEventListener('did-navigate', handleUrlChange);
            };
        }

        function setBrowserEventListeners(webview: Electron.WebviewTag) {
            webview.addEventListener('did-navigate', handleUrlChange);
            webview.addEventListener('did-navigate-in-page', handleUrlChange);
            webview.addEventListener('dom-ready', handleDomReady);
            webview.addEventListener('did-fail-load', handleDomFailed);
            webview.addEventListener('focus', handleWebviewFocus);
            webview.addEventListener('blur', handleWebviewBlur);
        }

        function handleUrlChange(e: any) {
            setWebviewSrc(e.url);
        }

        async function handleDomReady() {
            const webview = webviewRef.current as Electron.WebviewTag | null;
            if (!webview) {
                return;
            }
            webview.setZoomLevel(0);
            const body = await editorEngine.dom.getBodyFromWebview(webview);
            setDomFailed(body.children.length === 0);
            checkForOnlookEnabled(body);
        }

        function checkForOnlookEnabled(body: Element) {
            const doc = body.ownerDocument;
            setOnlookEnabled(isOnlookInDoc(doc));
        }

        function handleDomFailed() {
            setDomFailed(true);
            setTimeout(() => {
                const webview = webviewRef.current as Electron.WebviewTag | null;
                if (webview) {
                    webview.reload();
                }
            }, RETRY_TIMEOUT);
        }

        function handleWebviewFocus() {
            setFocused(true);
        }

        function handleWebviewBlur() {
            setFocused(false);
        }

        return (
            <div className="relative">
                <BrowserControls
                    webviewRef={webviewRef}
                    webviewSrc={webviewSrc}
                    setWebviewSrc={setWebviewSrc}
                    selected={selected}
                    hovered={hovered}
                    setHovered={setHovered}
                    onlookEnabled={onlookEnabled}
                />
                <Canvas>
                    <div className="flex flex-col space-y-4">
                        <div className="relative">
                            <ResizeHandles
                                webviewRef={webviewRef}
                                webviewSize={webviewSize}
                                setWebviewSize={setWebviewSize}
                            />
                            <webview
                                id={settings.id}
                                ref={webviewRef}
                                className={clsx(
                                    'w-[96rem] h-[60rem] backdrop-blur-sm transition outline outline-4',
                                    domFailed ? 'bg-transparent' : 'bg-white',
                                    focused
                                        ? 'outline-blue-300'
                                        : selected
                                          ? 'outline-teal-300'
                                          : 'outline-transparent',
                                )}
                                src={settings.url}
                                preload={`file://${window.env.WEBVIEW_PRELOAD_PATH}`}
                                allowpopups={'true' as any}
                                style={{
                                    width: webviewSize.width,
                                    height: webviewSize.height,
                                    marginTop: `${editorEngine.canvas.scale * 2}rem`,
                                }}
                            ></webview>
                            <GestureScreen webviewRef={webviewRef} setHovered={setHovered} />
                            {domFailed && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-gray-200/40 via-gray-500/40 to-gray-600/40 border-gray-500 border-[0.5px] space-y-4 rounded-xl">
                                    <p className="text-active text-title1 text-center">
                                        {'Your React app is not running'}
                                    </p>
                                    <p className="text-text text-title2 leading-normal text-center">
                                        {`Make sure that your app is running in your terminal`}
                                        <br />
                                        {`and that you're pointing the above browser URL to the correct location`}
                                    </p>
                                    <Button
                                        variant={'link'}
                                        size={'lg'}
                                        className="text-title2"
                                        onClick={() => {
                                            window.open(Links.USAGE_DOCS, '_blank');
                                        }}
                                    >
                                        Read the get started guide
                                        <ExternalLinkIcon className="ml-2 w-6 h-6" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </Canvas>
            </div>
        );
    },
);

export default Frame;
