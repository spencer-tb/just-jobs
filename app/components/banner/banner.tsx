"use client";

import React from "react";
import useTypingEffect from "./use-typing-words";
import { useTheme } from "../../theme-context";
import { PageType } from "../../types/enums";
import styles from "./banner.module.css";

interface BannerProps {
    type?: PageType;
    title: string;
}

function Banner({ type, title }: BannerProps) {
    const typingEffect = useTypingEffect({ type });
    let bannerContent;

    switch (type) {
        case PageType.CATEGORY:
        default:
            bannerContent = (
                <>
                    <h1 className={styles.bannerTitle}>{title}</h1>
                </>
            );
            break;
        case PageType.HOME:
            bannerContent = (
                <>
                    <div className={styles.bannerAnimation}>
                        {typingEffect}
                        <span className={styles.circle}>{"●"}</span>
                    </div>
                    <h1 className={styles.bannerTitleHome}>{title}</h1>
                    <BannerEmailSignUp />
                    <BannerCompanies />
                </>
            );
            break;
        case PageType.POST:
            bannerContent = (
                <>
                    <h1 className={styles.bannerTitle}>{title}</h1>
                </>
            );
            break;
    }
    return <div className={styles.banner}>{bannerContent}</div>;
}

function BannerEmailSignUp() {
    return (
        <div className={styles.bannerEmailSignup}>
            <div className={styles.bannerEmailSignupForm}>
                <p className={styles.bannerEmailSignupTitle}>
                    Receive new AI jobs directly by email daily
                </p>
                <input
                    className={styles.bannerEmailSignupInput}
                    placeholder="Enter email address"
                    type="email"
                    name="email"
                    id="email"
                    autoComplete="off"
                    spellCheck="false"
                />
            </div>
            <button className={styles.bannerEmailSignupButton} type="submit">
                Subscribe
            </button>
        </div>
    );
}

function BannerCompanies() {
    const { isDarkTheme } = useTheme();
    const theme = isDarkTheme ? "dark" : "light";
    return (
        <div className={styles.bannerComp}>
            <div className={styles.bannerCompColumn}>
                <p className={styles.bannerCompText}>
                    Trusted by world leading companies embracing AI
                </p>
                <div className={styles.bannerCompLogos}>
                    {Array.from({ length: 5 }).map((_, index) => (
                        <img
                            key={index}
                            src={`images/recruiter-logos/${index}-${theme}.png`}
                            alt={`Company Logo ${index}`}
                            className={styles.bannerCompLogo}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default React.memo(Banner);
