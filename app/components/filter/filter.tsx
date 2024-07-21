"use client";

import { useState, useEffect } from "react";
import SearchField from "./search-field";
import styles from "./filter.module.css";
import { useTheme } from "../../theme-context";
import {
    JobsTagsOptions,
    JobsCountryOptions,
} from "../../types/pocketbase-types";

interface FilterProps {
    onFilterChange: (tags: { tags: string[]; locations: string[] }) => void;
}

function Filter(props: FilterProps) {
    const { onFilterChange } = props;
    const { isDarkTheme } = useTheme();

    const [selectedTags, setSelectedTags] = useState<any[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<any[]>([]);

    // Call the callback function whenever selectedOptions change

    useEffect(() => {
        const tags = selectedTags.map((option) => option.value);
        const locations = selectedLocation.map((option) => option.value);
        onFilterChange({ tags, locations });
    }, [selectedTags, selectedLocation]);

    return (
        <div className={styles.filter}>
            <div className={styles.filterSearchBars}>
                <div className={styles.filterBar}>
                    <SearchField
                        className={styles.search}
                        jobEnums={JobsTagsOptions}
                        onChange={(options: any[]) => setSelectedTags(options)}
                        defaultValue={"Search"}
                    />
                </div>
                <div className={styles.filterBar}>
                    <SearchField
                        className={styles.search}
                        jobEnums={JobsCountryOptions}
                        onChange={(options: any[]) =>
                            setSelectedLocation(options)
                        }
                        defaultValue={"Location"}
                    />
                </div>
            </div>
            {/* Selected Tags */}
            <div className={styles.filterSelectedTags}>
                {selectedTags.map((option, index) => (
                    <div key={index} className={styles.filterSelectedTag}>
                        {option.label}
                    </div>
                ))}
                {selectedLocation.map((option, index) => (
                    <div key={index} className={styles.filterSelectedTag}>
                        {option.label}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Filter;
