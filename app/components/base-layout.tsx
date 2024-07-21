"use client";

import { useEffect } from "react";
import { useTheme } from "../theme-context";
import Header from "./header/header";
import Banner from "./banner/banner";
import Jobs from "./jobs/jobs";
import Footer from "./footer/footer";
import { PageType } from "../types/enums";

interface BaseLayoutProps {
    pageType: PageType;
    bannerTitle: string;
    tag?: string;
    location?: string;
}

const BaseLayout: React.FC<BaseLayoutProps> = ({
    pageType,
    bannerTitle,
    tag,
    location,
}) => {
    const { isDarkTheme } = useTheme();

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
            <Header type={pageType} />
            <main>
                <Banner type={pageType} title={bannerTitle} />
                <div className="mainContent">
                    <Jobs tag={tag} location={location} />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default BaseLayout;
