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
    MoonIcon,
    ReloadIcon,
    SunIcon,
} from '@radix-ui/react-icons';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { Links } from '/common/constants';

interface BrowserControlsProps {
    webviewRef: React.RefObject<Electron.WebviewTag>;
    webviewSrc: string;
    setWebviewSrc: React.Dispatch<React.SetStateAction<string>>;
    selected: boolean;
    hovered: boolean;
    setHovered: React.Dispatch<React.SetStateAction<boolean>>;
    darkmode: boolean;
    setDarkmode: React.Dispatch<React.SetStateAction<boolean>>;
    onlookEnabled: boolean;
}

function BrowserControls({
    webviewRef,
    webviewSrc,
    setWebviewSrc,
    selected,
    hovered,
    setHovered,
    darkmode,
    setDarkmode,
    onlookEnabled,
}: BrowserControlsProps) {
    const [urlInputValue, setUrlInputValue] = useState(webviewSrc);
    useEffect(() => {
        setUrlInputValue(webviewSrc);
    }, [webviewSrc]);

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

    function handleKeydown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
            return;
        }
    }

    function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
        const webview = webviewRef.current as Electron.WebviewTag | null;
        if (!webview) {
            return;
        }

        const validUrl = getValidUrl(e.currentTarget.value);
        webview.src = validUrl;
        webview.loadURL(validUrl);
        setWebviewSrc(validUrl);
    }

    function toggleTheme() {
        const webview = webviewRef.current as Electron.WebviewTag | null;
        if (!webview) {
            return;
        }

        webview.executeJavaScript(`window.api?.toggleTheme()`).then((res) => setDarkmode(res));
    }

    return (
        <div
            className={clsx(
                'flex flex-row items-center space-x-2 p-2 rounded-lg backdrop-blur-sm transition',
                selected ? ' bg-active/60 ' : '',
                hovered ? ' bg-hover/20 ' : '',
            )}
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
                value={urlInputValue}
                onChange={(e) => setUrlInputValue(e.target.value)}
                onKeyDown={handleKeydown}
                onBlur={handleBlur}
            />
            <Button variant="outline" className="bg-transparent" size="icon" onClick={toggleTheme}>
                {darkmode ? <MoonIcon /> : <SunIcon />}
            </Button>
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
                                    <p className="text-active text-largePlus">Onlook is enabled</p>
                                    <CheckCircledIcon className="mt-[3px] text-teal-900" />
                                </div>
                                <p className="text-text text-regular">
                                    Your codebase is now linked to the editor, giving you advanced
                                    features like write-to-code, component detection, code inspect,
                                    and more
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
}

export default BrowserControls;
