import { ReactNode, useEffect, useRef, useState } from 'react';
import { useEditorEngine } from '..';
import PanOverlay from './PanOverlay';
import { isMetaKey } from '@/lib/utils';

const Canvas = ({ children }: { children: ReactNode }) => {
    const [position, setPosition] = useState({ x: 300, y: 50 });
    const [scale, setScale] = useState(0.6);

    const editorEngine = useEditorEngine();
    const containerRef = useRef<HTMLDivElement>(null);
    const zoomSensitivity = 0.006;
    const panSensitivity = 0.52;

    const handleWheel = (event: WheelEvent) => {
        if (isMetaKey(event)) {
            handleZoom(event);
        } else {
            handlePan(event);
        }
    };

    const handleZoom = (event: WheelEvent) => {
        if (!containerRef.current) {
            return;
        }
        event.preventDefault();
        const zoomFactor = -event.deltaY * zoomSensitivity;
        const rect = containerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const newScale = scale * (1 + zoomFactor);
        const deltaX = (x - position.x) * zoomFactor;
        const deltaY = (y - position.y) * zoomFactor;

        setScale(newScale);
        setPosition((prevPosition) => ({
            x: prevPosition.x - deltaX,
            y: prevPosition.y - deltaY,
        }));
    };

    const handlePan = (event: WheelEvent) => {
        const deltaX = (event.deltaX + (event.shiftKey ? event.deltaY : 0)) * panSensitivity;
        const deltaY = (event.shiftKey ? 0 : event.deltaY) * panSensitivity;
        setPosition((prevPosition) => ({
            x: prevPosition.x - deltaX,
            y: prevPosition.y - deltaY,
        }));
    };

    const handleCanvasClicked = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target !== containerRef.current) {
            return;
        }
        editorEngine.webviews.deselectAll();
        editorEngine.webviews.notify();
        editorEngine.clear();
    };

    useEffect(() => {
        const div = containerRef.current;
        if (div) {
            div.addEventListener('wheel', handleWheel, { passive: false });
            return () => div.removeEventListener('wheel', handleWheel);
        }
    }, [handleWheel]);

    const handleZoomShortcut = (event: KeyboardEvent) => {
        if (!isMetaKey(event)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        switch (event.key) {
            case '0':
                setScale(1);
                break;
            case '=':
                setScale(scale * 1.2);
                break;
            case '-':
                setScale(scale * 0.8);
                break;
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleZoomShortcut);
        return () => {
            window.removeEventListener('keydown', handleZoomShortcut);
        };
    }, [handleZoomShortcut]);

    useEffect(() => {
        editorEngine.scale = scale;
    }, [position, scale]);

    return (
        <div
            ref={containerRef}
            className="overflow-hidden bg-bg flex flex-grow relative"
            onClick={handleCanvasClicked}
        >
            <div
                style={{
                    transition: 'transform ease',
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transformOrigin: '0 0',
                }}
            >
                {children}
            </div>
            <PanOverlay setPosition={setPosition} />
        </div>
    );
};

export default Canvas;
