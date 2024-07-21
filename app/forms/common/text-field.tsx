"use client";

import { useState, useEffect } from "react";

interface TextFieldProps {
    textArea: boolean;
    onChange: (item: string) => void;
    value?: string;
    id?: string;
    className?: string;
    inputGptValue?: string;
}

function TextField(props: TextFieldProps) {
    const { textArea, onChange, value, id, className, inputGptValue } = props;
    const [writtenText, setWrittenText] = useState(
        inputGptValue || value || ""
    );
    const isSalary = id === "min-salary" || id === "max-salary";

    useEffect(() => {
        if (inputGptValue) {
            setWrittenText(inputGptValue);
        }
    }, [inputGptValue]);

    return textArea ? (
        <textarea
            className={className ? className : "textbox"}
            required
            value={writtenText}
            onChange={(event) => {
                setWrittenText(event.target.value);
                onChange(event.target.value);
            }}
            id={id}
        />
    ) : (
        <input
            className={className ? className : "textbox"}
            required
            value={writtenText}
            onChange={(event) => {
                setWrittenText(event.target.value);
                onChange(event.target.value);
            }}
            id={id}
            readOnly={isSalary}
        />
    );
}

export default TextField;
