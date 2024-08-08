import { stringToHex } from '@/lib/editor/engine/styles/colors';
import { ElementStyle } from '@/lib/editor/engine/styles/models';
import { Cross2Icon, PlusIcon } from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';
import { PopoverPicker } from './PopoverColorPicker';
import { constructChangeCurried, UpdateElementStyleCallback } from '../InputsCommon';

interface ColorInputProps {
    elementStyle: ElementStyle;
    updateElementStyle: UpdateElementStyleCallback;
}

export default function ColorInput({ elementStyle, updateElementStyle }: ColorInputProps) {
    const [inputString, setInputString] = useState(() => stringToHex(elementStyle.value));

    const constructChange = constructChangeCurried(elementStyle.value);

    useEffect(() => {
        setInputString(stringToHex(elementStyle.value));
    }, [elementStyle]);

    function isNoneInput() {
        return inputString === 'initial' || inputString === '';
    }

    function formatColorInput(colorInput: string): string {
        if (/^[0-9A-F]{6}$/i.test(colorInput)) {
            return '#' + colorInput;
        }
        return colorInput;
    }

    function renderColorInput() {
        return (
            <PopoverPicker
                color={inputString}
                onChange={(color: string) => {
                    updateElementStyle(elementStyle.key, constructChange(color));
                    setInputString(color);
                }}
            />
        );
    }

    function renderTextInput() {
        return (
            <input
                className="w-16 text-xs border-none text-active bg-transparent text-start focus:outline-none focus:ring-0"
                type="text"
                value={isNoneInput() ? '' : inputString}
                placeholder="None"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.currentTarget.blur();
                    }
                }}
                onChange={(event) => {
                    const formattedColor = formatColorInput(event.target.value);
                    setInputString(formattedColor);
                    updateElementStyle(elementStyle.key, constructChange(formattedColor));
                }}
            />
        );
    }

    function renderControlButton() {
        return (
            <button
                className="text-tertiary"
                onClick={() => {
                    const newValue = isNoneInput() ? '#000000' : '';
                    setInputString(newValue);
                    updateElementStyle(elementStyle.key, constructChange(newValue));
                }}
            >
                {isNoneInput() ? <PlusIcon /> : <Cross2Icon />}
            </button>
        );
    }

    return (
        <div className="w-32 p-[6px] gap-2 bg-bg flex flex-row rounded cursor-pointer">
            {renderColorInput()}
            {renderTextInput()}
            {renderControlButton()}
        </div>
    );
}
