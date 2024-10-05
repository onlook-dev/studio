import { useEditorEngine } from '@/components/Context';
import { formatColorInput, isColorEmpty, stringToHex } from '@/lib/editor/styles/colors';
import { SingleStyle } from '@/lib/editor/styles/models';
import { Cross2Icon, PlusIcon } from '@radix-ui/react-icons';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { PopoverPicker } from './PopoverColorPicker';
import { Change } from '/common/actions';

const ColorInput = observer(
    ({
        elementStyle,
        onValueChange,
    }: {
        elementStyle: SingleStyle;
        onValueChange?: (key: string, value: string) => void;
    }) => {
        const editorEngine = useEditorEngine();
        const [originalValue, setOriginalValue] = useState(elementStyle.defaultValue);
        const [value, setValue] = useState(elementStyle.defaultValue);
        const [isOpen, toggleOpen] = useState(false);

        useEffect(() => {
            if (!editorEngine.style.selectedStyle) {
                return;
            }
            const newValue = elementStyle.getValue(editorEngine.style.selectedStyle?.styles);
            const hexValue = stringToHex(newValue);
            setValue(hexValue);
            setOriginalValue(newValue);
        }, [editorEngine.style.selectedStyle]);

        function sendStyleUpdate(newValue: string) {
            setValue(newValue);
            const change: Change<string> = {
                original: originalValue,
                updated: newValue,
            };
            editorEngine.style.updateElementStyle(elementStyle.key, change);
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
                />
            );
        }

        function renderControlButton() {
            return (
                <button
                    className="text-text"
                    onClick={() => {
                        const newValue = isColorEmpty(value) ? '#000000' : 'transparent';
                        sendStyleUpdate(newValue);
                    }}
                >
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