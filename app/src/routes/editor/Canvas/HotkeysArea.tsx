import { useEditorEngine } from '@/components/Context';
import { EditorMode } from '@/lib/models';
import { ReactNode } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { DefaultSettings } from '/common/constants';
import { Hotkey } from '/common/hotkeys';

interface HotkeysAreaProps {
    children: ReactNode;
    scale: number;
    setScale: React.Dispatch<React.SetStateAction<number>>;
}

const HotkeysArea = ({ children, scale, setScale }: HotkeysAreaProps) => {
    const editorEngine = useEditorEngine();

    // Zoom
    useHotkeys('mod+0', () => setScale(DefaultSettings.SCALE), { preventDefault: true });
    useHotkeys('mod+equal', () => setScale(scale * 1.2), { preventDefault: true });
    useHotkeys('mod+minus', () => setScale(scale * 0.8), { preventDefault: true });

    // Modes
    useHotkeys(Hotkey.SELECT.command, () => (editorEngine.mode = EditorMode.DESIGN));
    useHotkeys(Hotkey.ESCAPE.command, () => {
        editorEngine.mode = EditorMode.DESIGN;
        !editorEngine.text.isEditing && editorEngine.clear();
    });
    useHotkeys(Hotkey.PAN.command, () => (editorEngine.mode = EditorMode.PAN));
    useHotkeys(Hotkey.INTERACT.command, () => (editorEngine.mode = EditorMode.INTERACT));
    useHotkeys(Hotkey.INSERT_DIV.command, () => (editorEngine.mode = EditorMode.INSERT_DIV));
    useHotkeys(Hotkey.INSERT_TEXT.command, () => (editorEngine.mode = EditorMode.INSERT_TEXT));

    useHotkeys('space', () => (editorEngine.mode = EditorMode.PAN), { keydown: true });
    useHotkeys('space', () => (editorEngine.mode = EditorMode.DESIGN), { keyup: true });

    // Actions
    useHotkeys(Hotkey.UNDO.command, () => editorEngine.action.undo());
    useHotkeys(Hotkey.REDO.command, () => editorEngine.action.redo());
    useHotkeys('enter', () => editorEngine.textEditSelectedElement());
    useHotkeys([Hotkey.BACKSPACE.command, Hotkey.DELETE.command], () =>
        editorEngine.elements.delete(),
    );

    return <>{children}</>;
};

export default HotkeysArea;
