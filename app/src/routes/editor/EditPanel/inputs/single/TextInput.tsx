import { useEditorEngine } from '@/components/Context';
import { SingleStyle } from '@/lib/editor/styles/models';
import { handleNumberInputKeyDown } from '@/lib/editor/styles/numberUnit';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';

const TextInput = observer(
    ({
        elementStyle,
        onValueChange,
    }: {
        elementStyle: SingleStyle;
        onValueChange?: (key: string, value: string) => void;
    }) => {
        const editorEngine = useEditorEngine();
        const [value, setValue] = useState(elementStyle.defaultValue);

        useEffect(() => {
            if (!editorEngine.style.selectedStyle) {
                return;
            }
            const newValue = elementStyle.getValue(editorEngine.style.selectedStyle?.styles);
            setValue(newValue);
        }, [editorEngine.style.selectedStyle]);

        const sendStyleUpdate = (newValue: string) => {
            setValue(newValue);
            editorEngine.style.updateElementStyle(elementStyle.key, newValue);
            onValueChange && onValueChange(elementStyle.key, newValue);
        };

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.currentTarget.value;
            sendStyleUpdate(newValue);
        };

        return (
            <input
                type="text"
                className={`w-full p-[6px] text-xs px-2 rounded border-none text-active bg-bg/75 text-start focus:outline-none focus:ring-0 appearance-none`}
                placeholder="--"
                value={value}
                onChange={handleInputChange}
                onFocus={editorEngine.history.startTransaction}
                onBlur={editorEngine.history.commitTransaction}
                onKeyDown={(e) =>
                    handleNumberInputKeyDown(e, elementStyle.key, value, setValue, sendStyleUpdate)
                }
            />
        );
    },
);

export default TextInput;
