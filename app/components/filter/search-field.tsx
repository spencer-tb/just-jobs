"use client";

import Select from "react-select";
import { useState, useEffect } from "react";
import {
    JobsCountryOptions,
    JobsTagsOptions,
} from "../../types/pocketbase-types";

interface SearchFieldProps {
    jobEnums: typeof JobsTagsOptions | typeof JobsCountryOptions;
    className: string;
    onChange: (selectedOptions: any[]) => void;
    defaultValue: string;
}

function SearchField(props: SearchFieldProps) {
    const { jobEnums, className, onChange, defaultValue } = props;

    type Option = { label: string; value: string };
    const options: Option[] =
        jobEnums &&
        Object.values(jobEnums).map((value) => ({
            label: value,
            value,
        }));
    const [optionSelected, setOptionSelected] = useState<Option[]>();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const styleProxy = new Proxy(
        {},
        {
            get: (target, propKey) => () => {},
        }
    );

    // Define a function to handle changes to the React Select component.
    const handleOptionChange = (selectedOptions: Option | any) => {
        // Set the new state for optionSelected.
        const newOptions = Array.isArray(selectedOptions)
            ? selectedOptions
            : [selectedOptions];
        setOptionSelected(newOptions);
        // console.log(optionSelected)

        // Call the onChange callback with the new options.
        onChange(newOptions);
    };

    // Only render the Select component on the client side
    if (!isClient) {
        return null;
    }

    return (
        <Select
            options={options}
            components={{ IndicatorSeparator: null }}
            value={optionSelected}
            onChange={handleOptionChange}
            classNamePrefix={className}
            placeholder={defaultValue}
            isMulti={false}
            tabSelectsValue={false}
            hideSelectedOptions={true}
        />
    );
}

export default SearchField;
