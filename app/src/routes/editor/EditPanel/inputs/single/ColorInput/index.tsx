import { useEditorEngine } from '@/components/Context';
import { formatColorInput, isColorEmpty, stringToHex } from '@/lib/editor/styles/colors';
import { SingleStyle } from '@/lib/editor/styles/models';
import { Cross2Icon, PlusIcon } from '@radix-ui/react-icons';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { PopoverPicker } from './PopoverColorPicker';

const ColorInput = observer(
    ({
        elementStyle,
        onValueChange,
    }: {
        elementStyle: SingleStyle;
        onValueChange?: (key: string, value: string) => void;
    }) => {
        const editorEngine = useEditorEngine();
        const [value, setValue] = useState(elementStyle.defaultValue);
        const [isOpen, toggleOpen] = useState(false);

        useEffect(() => {
            if (!editorEngine.style.selectedStyle) {
                return;
            }
            const newValue = elementStyle.getValue(editorEngine.style.selectedStyle?.styles);
            const hexValue = stringToHex(newValue);
            setValue(hexValue);
        }, [editorEngine.style.selectedStyle]);

        function sendStyleUpdate(newValue: string) {
            setValue(newValue);
            editorEngine.style.updateElementStyle(elementStyle.key, newValue);
            onValueChange && onValueChange(elementStyle.key, newValue);
        }

        function renderColorInput() {
            return (
                <PopoverPicker
                    isOpen={isOpen}
                    toggleOpen={toggleOpen}
                    color={value}
                    onChange={sendStyleUpdate}
                />
            );
        }

        function renderTextInput() {
            return (
                <input
                    className="w-16 text-xs border-none text-active bg-transparent text-start focus:outline-none focus:ring-0 "
                    type="text"
                    value={isColorEmpty(value) ? '' : value}
                    placeholder="None"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.currentTarget.blur();
                        }
                    }}
                    onChange={(event) => {
                        const formattedColor = formatColorInput(event.target.value);
                        sendStyleUpdate(formattedColor);
                    }}
                    onFocus={editorEngine.history.startTransaction}
                    onBlur={editorEngine.history.commitTransaction}
                />
            );
        }

        function handleColorButtonClick() {
            const newValue = isColorEmpty(value) ? '#000000' : 'transparent';
            sendStyleUpdate(newValue);
        }

        function renderControlButton() {
            return (
                <button className="text-text" onClick={handleColorButtonClick}>
                    {isColorEmpty(value) ? <PlusIcon /> : <Cross2Icon />}
                </button>
            );
        }

        return (
            <div className="w-32 p-[6px] gap-2 flex flex-row rounded cursor-pointer bg-bg/75">
                {renderColorInput()}
                {renderTextInput()}
                {renderControlButton()}
            </div>
        );
    },
);

export default ColorInput;
