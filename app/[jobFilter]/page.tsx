"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "../theme-context";
import Header from "../components/header/header";
import Banner from "../components/banner/banner";
import Jobs from "../components/jobs/jobs";
import Footer from "../components/footer/footer";
import { PageType } from "../types/enums";

const JobFilterPage: React.FC = () => {
    const { isDarkTheme } = useTheme();
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

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty(
            "--wrap-tx-color",
            isDarkTheme ? "var(--dark-wrap-tx)" : "var(--light-wrap-tx)"
        );
        root.style.setProperty(
            "--tx-color",
            isDarkTheme ? "var(--dark-tx)" : "var(--light-tx)"
        );
        root.style.setProperty(
            "--bg-color",
            isDarkTheme ? "var(--dark-bg)" : "var(--light-bg)"
        );
        root.style.setProperty(
            "--hl-color",
            isDarkTheme ? "var(--dark-hl)" : "var(--light-hl)"
        );
    }, [isDarkTheme]);

    return (
        <div>
            <Header />
            <main>
                <Banner type={PageType.FILTER} title={bannerTitle} />
                <div className="mainContent">
                    <Jobs tag={tag} location={location} />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default JobFilterPage;
