"use client";

import { useState, useEffect } from "react";
import SearchField from "./search-field";
import styles from "./filter.module.css";
import { useTheme } from "../../theme-context";
import { useRouter } from "next/navigation";
import {
    JobsTagsOptions,
    JobsCountryOptions,
} from "../../types/pocketbase-types";

interface FilterProps {
    onFilterChange: (filters: { tags: string[]; locations: string[] }) => void;
}

function Filter(props: FilterProps) {
    const { onFilterChange } = props;
    const { isDarkTheme } = useTheme();
    const router = useRouter();
    const [selectedTags, setSelectedTags] = useState<any[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<any[]>([]);

    useEffect(() => {
        const tags = selectedTags.map((option) => option.value);
        const locations = selectedLocation.map((option) => option.value);
        onFilterChange({ tags, locations });

        if (tags.length === 0 && locations.length === 0) {
            // Do not change URL if no filters are selected
            return;
        }

        const tagsParam = encodeURIComponent(tags.join(","));
        const locationsParam = encodeURIComponent(locations.join(","));
        const query = `?tags=${tagsParam}&locations=${locationsParam}`;

        router.push(`/jobs${query}`);
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
