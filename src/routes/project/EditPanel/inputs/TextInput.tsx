import { NumberUnit } from '@/lib/editor/engine/styles/numberUnit';
import { appendCssUnit } from '@/lib/editor/engine/styles/units';
import React, { useEffect, useState } from 'react';

type ElementStyle = {
    key: string;
    value: string;
};

interface Props {
    elementStyle: ElementStyle;
    updateElementStyle: (key: string, value: string, refresh?: boolean) => void;
    inputWidth?: string;
}

const TextInput = ({ elementStyle, updateElementStyle, inputWidth = "w-full" }: Props) => {
    const [localValue, setLocalValue] = useState(elementStyle.value);
    const [isFocused, setIsFocused] = useState(false);
    const numberUnit = new NumberUnit();

    useEffect(() => {
        if (!isFocused) {
            setLocalValue(elementStyle.value);
        }
    }, [isFocused, elementStyle.value]);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.currentTarget.value;
        setLocalValue(newValue);
        updateElementStyle(elementStyle.key, appendCssUnit(newValue));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        let step = 1;
        if (e.key === "Enter") {
            e.currentTarget.blur();
            return;
        }
        if (e.shiftKey) step = 10;

        let [parsedNumber, parsedUnit] = numberUnit.stringToParsedValue(localValue);

        if (e.key === "ArrowUp") {
            parsedNumber += step;
            e.preventDefault();
        } else if (e.key === "ArrowDown") {
            parsedNumber -= step;
            e.preventDefault();
        }

        const stringValue = numberUnit.parsedValueToString(parsedNumber, parsedUnit);
        setLocalValue(stringValue);
        updateElementStyle(elementStyle.key, stringValue);
    };

    return (
        <input
            type="text"
            className={`${inputWidth} p-[6px] text-xs px-2 rounded border-none text-text bg-stone-900 text-start focus:outline-none focus:ring-0 appearance-none`}
            placeholder="--"
            value={localValue}
            onChange={handleInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
        />
    );
};

export default TextInput;
