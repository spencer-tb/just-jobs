"use client";

import React, { useState, useEffect } from "react";
import { Slider, Box, SliderProps, styled } from "@mui/material";
import TextField from "./text-field";
import "../Forms.css";

interface Props {
    min?: number;
    max?: number;
    step?: number;
    defaultRange?: [number, number];
    onRangeChange?: (range: [number, number]) => void;
    inputGptValue?: string;
}

const GradientSlider = styled(Slider, {
    shouldForwardProp: (prop) => prop !== "gradient",
})<{ gradient: string }>(({ theme, gradient }) => ({
    height: 6,
    "& .MuiSlider-track": {
        display: "none",
    },
    "& .MuiSlider-rail": {
        background: gradient,
    },
    "& .MuiSlider-thumb": {
        background: gradient,
        "&:hover, &.Mui-focusVisible": {
            boxShadow: "none",
        },
    },
}));

const SalaryRangeSlider: React.FC<Props> = ({
    min = 1000,
    max = 300000,
    step = 1000,
    defaultRange = [1000, 300000],
    onRangeChange,
    inputGptValue,
}) => {
    const [salaryRange, setSalaryRange] =
        useState<[number, number]>(defaultRange);

    // For inputGptValue auto-fill
    const parseGptValueToRange = (input: string): [number, number] => {
        const regex = /\d+/g;
        const matches = input.match(regex);
        if (matches && matches.length === 2) {
            const range = matches.map((value) => parseInt(value) * 1000);
            return range as [number, number];
        } else {
            return defaultRange;
        }
    };
    useEffect(() => {
        if (inputGptValue) {
            setSalaryRange(parseGptValueToRange(inputGptValue));
        }
    }, [inputGptValue]);

    const handleSalaryRangeChange = (
        event: Event,
        value: number | number[],
        activeThumb: number
    ) => {
        if (Array.isArray(value)) {
            setSalaryRange(value as [number, number]);
            if (onRangeChange) {
                onRangeChange(value as [number, number]);
            }
        }
    };

    const formatSalaryValue = (value: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(value);
    };

    const sliderProps: SliderProps = {
        value: salaryRange,
        onChange: handleSalaryRangeChange,
        valueLabelDisplay: "off",
        min,
        max,
        step,
    };

    useEffect(() => {
        // Update text fields whenever the salaryRange state changes
        const [minSalary, maxSalary] = salaryRange;
        const minTextField = document.getElementById(
            "min-salary"
        ) as HTMLInputElement;
        const maxTextField = document.getElementById(
            "max-salary"
        ) as HTMLInputElement;
        if (minTextField && maxTextField) {
            minTextField.value =
                "💸  " +
                formatSalaryValue(minSalary).toString().slice(0, -7) +
                "k";
            maxTextField.value =
                "💸  " +
                formatSalaryValue(maxSalary).toString().slice(0, -7) +
                "k";
        }
    }, [salaryRange]);

    return (
        <div className="salary-slider">
            <div className="text-fields">
                <input
                    type="text"
                    className="min-salary"
                    id="min-salary"
                    readOnly
                />
                <input
                    type="text"
                    className="max-salary"
                    id="max-salary"
                    readOnly
                />
            </div>
            <GradientSlider
                {...sliderProps}
                gradient="linear-gradient(to right, #30CFD0, #c43ad6);"
            />
        </div>
    );
};

export default SalaryRangeSlider;
