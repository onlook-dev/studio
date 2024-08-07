import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { EditorMode } from '@/lib/models';
import { CursorArrowIcon, HandIcon, SquareIcon, TextIcon } from '@radix-ui/react-icons';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useEditorEngine } from '..';

const Toolbar = observer(() => {
    const editorEngine = useEditorEngine();
    const [mode, setMode] = useState<EditorMode>(editorEngine.mode);

    useEffect(() => {
        setMode(editorEngine.mode);
    }, [editorEngine.mode]);

    return (
        <div
            className={clsx(
                'border p-1 flex bg-black/80 backdrop-blur rounded-lg shadow items-center justify-center',
                editorEngine.mode === EditorMode.INTERACT ? 'hidden' : 'visible',
            )}
        >
            <ToggleGroup
                type="single"
                value={mode}
                onValueChange={(value) => {
                    if (value) {
                        editorEngine.mode = value as EditorMode;
                        setMode(value as EditorMode);
                    }
                }}
            >
                <ToggleGroupItem value={EditorMode.DESIGN} aria-label={EditorMode.DESIGN + ' Mode'}>
                    <CursorArrowIcon />
                </ToggleGroupItem>
                <ToggleGroupItem value={EditorMode.PAN} aria-label={EditorMode.PAN + ' Mode'}>
                    <HandIcon />
                </ToggleGroupItem>
                <ToggleGroupItem
                    value={EditorMode.INSERT_DIV}
                    aria-label={EditorMode.INSERT_DIV + ' Mode'}
                >
                    <SquareIcon />
                </ToggleGroupItem>
                <ToggleGroupItem
                    value={EditorMode.INSERT_TEXT}
                    aria-label={EditorMode.INSERT_TEXT + ' Mode'}
                >
                    <TextIcon />
                </ToggleGroupItem>
            </ToggleGroup>
        </div>
    );
});

export default Toolbar;
