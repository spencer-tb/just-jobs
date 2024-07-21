"use client";

import Select, { MultiValue, SingleValue } from "react-select";
import { useState, useEffect } from "react";
import {
    JobsCountryOptions,
    JobsRemoteOptions,
    JobsTagsOptions,
} from "../../types/pocketbase-types";

// import "./ReactSelect.css";

interface ReactSelectFieldProps {
    jobEnums:
        | typeof JobsTagsOptions
        | typeof JobsCountryOptions
        | typeof JobsRemoteOptions;
    isMulti: boolean;
    className: string;
    defaultValue: string;
    maxValues: number;
    onChange: (values: any[]) => void;
}

function ReactSelectField(props: ReactSelectFieldProps) {
    const { jobEnums, isMulti, className, defaultValue, maxValues, onChange } =
        props;

    type Option = { label: string; value: string };
    const options: MultiValue<Option> = Object.values(jobEnums).map(
        (value) => ({
            label: value,
            value,
        })
    );

    const [optionsSelected, setOptionsSelected] =
        useState<MultiValue<Option>>();

    // For inputGptValue auto-fill
    const stringToMultiValueOption = (
        input: string | string[]
    ): MultiValue<Option> => {
        if (Array.isArray(input)) {
            return input.map((value) => ({ label: value, value }));
        } else {
            return [{ label: input, value: input }];
        }
    };

    return (
        <Select
            options={options}
            value={optionsSelected}
            onChange={(
                optionsSelected: MultiValue<Option> | SingleValue<Option>
            ) => {
                setOptionsSelected(optionsSelected as MultiValue<Option>);
                onChange(optionsSelected as Option[]);
            }}
            className={className + "-container"}
            placeholder={defaultValue}
            classNamePrefix={className}
            hideSelectedOptions={true}
            isMulti={isMulti}
            isOptionDisabled={(option: Option) => {
                return optionsSelected
                    ? optionsSelected.length >= maxValues
                    : false;
            }}
        />
    );
}

export default ReactSelectField;
