import { useEditorEngine } from '@/components/Context';
import {
    getAutolayoutStyles,
    LayoutMode,
    LayoutProperty,
    parseModeAndValue,
} from '@/lib/editor/styles/autolayout';
import { SingleStyle } from '@/lib/editor/styles/models';
import { handleNumberInputKeyDown } from '@/lib/editor/styles/numberUnit';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { observer } from 'mobx-react-lite';
import { ChangeEvent, useEffect, useState } from 'react';

const OPTION_OVERRIDES: Record<string, string | undefined> = {
    Fit: 'Hug',
    Relative: 'Rel',
};

const VALUE_OVERRIDE: Record<string, string | undefined> = {
    'fit-content': '',
};

const AutoLayoutInput = observer(({ elementStyle }: { elementStyle: SingleStyle }) => {
    const editorEngine = useEditorEngine();
    const [value, setValue] = useState(elementStyle.defaultValue);

    useEffect(() => {
        const selectedStyle = editorEngine.style.selectedStyle;
        if (!selectedStyle) {
            return;
        }
        const newValue = elementStyle.getValue(selectedStyle.styles);
        setValue(newValue);
    }, [editorEngine.style.selectedStyle]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newLayoutValue = e.target.value;
        setValue(newLayoutValue);
        sendStyleUpdate(newLayoutValue);
    };

    const handleModeInputChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const selectedStyle = editorEngine.style.selectedStyle;
        if (!selectedStyle) {
            console.error('No style record found');
            return;
        }

        const newMode = e.target.value;
        const { layoutValue } = parseModeAndValue(value);

        const newLayoutValue = getAutolayoutStyles(
            LayoutProperty[elementStyle.key as keyof typeof LayoutProperty],
            LayoutMode[newMode as keyof typeof LayoutMode],
            layoutValue,
            selectedStyle.rect,
            selectedStyle.parentRect,
        );

        setValue(newLayoutValue);
        sendStyleUpdate(newLayoutValue);
    };

    const sendStyleUpdate = (newValue: string) => {
        editorEngine.style.updateElementStyle(elementStyle.key, newValue);
    };

    const overrideValue = () => {
        const { layoutValue } = parseModeAndValue(value);
        const overriddenValue = VALUE_OVERRIDE[layoutValue];
        return overriddenValue !== undefined ? overriddenValue : layoutValue;
    };

    return (
        elementStyle && (
            <div className="flex flex-row gap-1 justify-end">
                <input
                    value={overrideValue()}
                    type="text"
                    className={`w-16 rounded p-1 px-2 text-xs border-none text-active bg-bg/75 text-start focus:outline-none focus:ring-0`}
                    placeholder="--"
                    onChange={handleInputChange}
                    onKeyDown={(e) =>
                        handleNumberInputKeyDown(
                            e,
                            elementStyle.key,
                            value,
                            setValue,
                            sendStyleUpdate,
                        )
                    }
                    onFocus={editorEngine.history.startTransaction}
                    onBlur={editorEngine.history.commitTransaction}
                />
                <div className="relative w-16">
                    <select
                        name={elementStyle.displayName}
                        value={parseModeAndValue(value).mode}
                        className="p-[6px] w-full px-2 text-start rounded border-none text-xs text-active bg-bg/75 appearance-none focus:outline-none focus:ring-0 capitalize"
                        onChange={handleModeInputChange}
                    >
                        {elementStyle.params?.units?.map((option) => (
                            <option key={option} className="bg-bg/75" value={option}>
                                {OPTION_OVERRIDES[option] || option}
                            </option>
                        ))}
                    </select>
                    <div className="text-text absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                        <ChevronDownIcon />
                    </div>
                </div>
            </div>
        )
    );
});

export default AutoLayoutInput;
