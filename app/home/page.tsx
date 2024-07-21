"use client";

import { useEffect } from "react";
import { useTheme } from "../theme-context";
import Header from "../components/header/header";
import Banner from "../components/banner/banner";
import Jobs from "../components/jobs/jobs";
import Footer from "../components/footer/footer";
import { PageType } from "../types/enums";

const Home: React.FC = () => {
    const { isDarkTheme, toggleTheme } = useTheme();

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
            <Header type={PageType.HOME} />
            <main>
                <Banner type={PageType.HOME} title="AI Jobs" />
                <div className="mainContent">
                    <Jobs />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Home;
