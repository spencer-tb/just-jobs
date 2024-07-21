"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import BaseLayout from "../components/base-layout";
import { PageType } from "../types/enums";

const JobFilterPage: React.FC = () => {
    const searchParams = useSearchParams();
    const [bannerTitle, setBannerTitle] = useState("AI Jobs");
    const [tag, setTag] = useState<string | undefined>(undefined);
    const [location, setLocation] = useState<string | undefined>(undefined);

    useEffect(() => {
        const tagsParam = searchParams.get("tags") || "";
        const locationsParam = searchParams.get("locations") || "";
        const tags = tagsParam.split(",").filter(Boolean);
        const locations = locationsParam.split(",").filter(Boolean);

        if (tags.length > 0) {
            setTag(tags[0]);
            setBannerTitle(`AI ${tags[0]} Jobs`);
        }

        if (locations.length > 0) {
            setLocation(locations[0]);
            setBannerTitle((prev) => `${prev} in ${locations[0]}`);
        }

        if (tags.length === 0 && locations.length === 0) {
            setBannerTitle("AI Jobs");
        }
    }, [searchParams]);

    return (
        <BaseLayout
            pageType={PageType.FILTER}
            bannerTitle={bannerTitle}
            tag={tag}
            location={location}
        />
    );
};

export default JobFilterPage;
