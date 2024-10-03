import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    CheckCircledIcon,
    CircleBackslashIcon,
    ExclamationTriangleIcon,
    ExternalLinkIcon,
    ReloadIcon,
} from '@radix-ui/react-icons';
import clsx from 'clsx';
import { Links } from '/common/constants';
import { useEffect, useState } from 'react';
import { useEditorEngine } from '@/components/Context';
import { observer } from 'mobx-react-lite';
interface BrowserControlsProps {
    webviewRef: React.RefObject<Electron.WebviewTag>;
    webviewSrc: string;
    setWebviewSrc: React.Dispatch<React.SetStateAction<string>>;
    selected: boolean;
    hovered: boolean;
    setHovered: React.Dispatch<React.SetStateAction<boolean>>;
    onlookEnabled: boolean;
}

const BrowserControls: React.FC<BrowserControlsProps> = observer(
    ({ webviewRef, webviewSrc, setWebviewSrc, selected, hovered, setHovered, onlookEnabled }) => {
        const editorEngine = useEditorEngine();
        const [scale, setScale] = useState(1);

        useEffect(() => {
            setScale(editorEngine.canvas.scale);
            console.log('print', editorEngine.canvas.scale);
            console.log(scale);
        }, [editorEngine.canvas.scale]);
        function goForward() {
            const webview = webviewRef.current as Electron.WebviewTag | null;
            if (!webview) {
                return;
            }
            if (webview.canGoForward()) {
                webview.goForward();
            }
        }

        function reload() {
            const webview = webviewRef.current as Electron.WebviewTag | null;
            if (!webview) {
                return;
            }
            webview.reload();
        }

        function goBack() {
            const webview = webviewRef.current as Electron.WebviewTag | null;
            if (!webview) {
                return;
            }
            if (webview.canGoBack()) {
                webview.goBack();
            }
        }

        function getValidUrl(url: string) {
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                return 'http://' + url;
            }
            return url;
        }

        function updateUrl(e: React.KeyboardEvent<HTMLInputElement>) {
            if (e.key !== 'Enter') {
                return;
            }

            const webview = webviewRef.current as Electron.WebviewTag | null;
            if (!webview) {
                return;
            }

            const validUrl = getValidUrl(webviewSrc);
            webview.src = validUrl;
            webview.loadURL(validUrl);
            e.currentTarget.blur();
        }

        return (
            <div
                className={clsx(
                    'flex flex-row items-center space-x-2 rounded-lg backdrop-blur-sm transition h-[4rem] absolute z-40',
                    selected ? ' bg-active/60 ' : '',
                    hovered ? ' bg-hover/20 ' : '',
                )}
                style={{
                    width: `${1536 * scale}px`,
                    top: '50%',
                    left: '49%',
                    transform: `translate(${-50 * scale}%,${-50 * scale}%))`,
                    transformOrigin: 'center',
                }}
                onMouseOver={() => setHovered(true)}
                onMouseOut={() => setHovered(false)}
            >
                <Button variant="outline" className="bg-transparent" onClick={goBack}>
                    <ArrowLeftIcon />
                </Button>
                <Button variant="outline" className="bg-transparent" onClick={goForward}>
                    <ArrowRightIcon />
                </Button>
                <Button variant="outline" className="bg-transparent" onClick={reload}>
                    <ReloadIcon />
                </Button>
                <Input
                    className="text-regularPlus"
                    value={webviewSrc}
                    onChange={(e) => setWebviewSrc(e.target.value)}
                    onKeyDown={updateUrl}
                />
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className={clsx(
                                onlookEnabled ? 'bg-transparent' : 'bg-red-500 hover:bg-red-700',
                            )}
                        >
                            {onlookEnabled ? <CheckCircledIcon /> : <ExclamationTriangleIcon />}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                        <div className="space-y-2 flex flex-col">
                            {onlookEnabled ? (
                                <>
                                    <div className="flex gap-2 width-full justify-center">
                                        <p className="text-active text-largePlus">
                                            Onlook is enabled
                                        </p>
                                        <CheckCircledIcon className="mt-[3px] text-teal-900" />
                                    </div>
                                    <p className="text-text text-regular">
                                        Your codebase is now linked to the editor, giving you
                                        advanced features like write-to-code, component detection,
                                        code inspect, and more
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="flex gap-2 width-full justify-center">
                                        <p className="text-active text-largePlus">
                                            Onlook is not enabled
                                        </p>
                                        <CircleBackslashIcon className="mt-[3px] text-red-500" />
                                    </div>
                                    <p className="text-text text-regular">
                                        {
                                            "You won't get advanced features like write-to-code, component detection, code inspect, and more."
                                        }
                                    </p>
                                    <Button
                                        className="mx-auto"
                                        variant="outline"
                                        onClick={() => {
                                            window.open(Links.USAGE_DOCS, '_blank');
                                        }}
                                    >
                                        Learn how to enable
                                        <ExternalLinkIcon className="ml-2" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        );
    },
);

export default BrowserControls;
