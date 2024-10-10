import { useEditorEngine } from '@/components/Context';
import { generateRowColumnTemplate, getRowColumnCount } from '@/lib/editor/styles/autolayout';
import { SingleStyle } from '@/lib/editor/styles/models';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';

const GridRowColInput = observer(({ elementStyle }: { elementStyle: SingleStyle }) => {
    const editorEngine = useEditorEngine();
    const [value, setValue] = useState(elementStyle.defaultValue);

    useEffect(() => {
        const selectedStyle = editorEngine.style.selectedStyle;
        if (!selectedStyle) {
            return;
        }
        const newValue = getRowColumnCount(elementStyle.getValue(selectedStyle.styles)).toString();
        setValue(newValue);
    }, [editorEngine.style.selectedStyle]);

    const handleInput = (event: any) => {
        const newValue = generateRowColumnTemplate(event.target.value);
        setValue(event.target.value);
        editorEngine.style.updateElementStyle(elementStyle.key, newValue);
    };

    return (
        <input
            type="number"
            className={`w-full p-[6px] text-xs px-2 rounded border-none text-active bg-bg/75 text-start focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
            placeholder="--"
            value={value}
            onInput={handleInput}
            onFocus={editorEngine.history.startTransaction}
            onBlur={editorEngine.history.commitTransaction}
        />
    );
});

export default GridRowColInput;
