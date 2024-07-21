import React from "react";
import { PageType } from "../../types/enums";
import styles from "./header.module.css";

interface HeaderProps {
    type?: PageType;
}

function Header({ type }: HeaderProps) {
    let navContent;
    switch (type) {
        case PageType.HOME:
        default:
            navContent = (
                <div className={styles.defaultNavItems}>
                    <a
                        className={styles.navItem}
                        href="/"
                        aria-label="Jobs in AI"
                    >
                        Jobs
                    </a>
                    <a
                        className={styles.navItem}
                        href="/"
                        aria-label="Learn AI"
                    >
                        Learn AI
                    </a>
                    <a
                        className={styles.navItem}
                        href="https://share.hsforms.com/1SAvw3sQyTTiT2uxR9N_4jQq6sz3"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Advertise
                    </a>
                    <a
                        className={styles.postNavItem}
                        href="https://share.hsforms.com/1zwMqIc6CT0CpVq46dicQdgq6sz3"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Post A Job
                    </a>
                </div>
            );
            break;
        case PageType.POST:
            navContent = <div>TODO</div>;
            break;
    }

    return (
        <header className={styles.header}>
            <nav className={styles.headerNav}>
                <a className={styles.logoNavItem} href="/">
                    Just AI Jobs◝
                </a>
                {navContent}
            </nav>
        </header>
    );
}

export default Header;
