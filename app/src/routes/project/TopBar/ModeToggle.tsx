import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { EditorMode } from '@/lib/models';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { useEditorEngine } from '..';

const ModeToggle = observer(() => {
    const editorEngine = useEditorEngine();
    const [mode, setMode] = useState<EditorMode>(editorEngine.mode);

    return (
        <ToggleGroup
            className="h-6 my-auto font-normal "
            type="single"
            value={mode}
            onValueChange={(value) => {
                if (value) {
                    editorEngine.mode = value as EditorMode;
                    setMode(value as EditorMode);
                }
            }}
        >
            <ToggleGroupItem
                variant={'overline'}
                value={EditorMode.DESIGN}
                aria-label={EditorMode.DESIGN + ' Mode'}
            >
                Design
            </ToggleGroupItem>
            <ToggleGroupItem
                variant={'overline'}
                value={EditorMode.INTERACT}
                aria-label={EditorMode.INTERACT + ' Mode'}
            >
                Interact
            </ToggleGroupItem>
        </ToggleGroup>
    );
});

export default ModeToggle;
