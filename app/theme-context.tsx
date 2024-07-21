"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";

interface ThemeContextType {
    isDarkTheme: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);

    useEffect(() => {
        const userPrefersDarkTheme = window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;
        setIsDarkTheme(userPrefersDarkTheme);

        const mediaQueryList = window.matchMedia(
            "(prefers-color-scheme: dark)"
        );
        const handleMediaQueryChange = (event: MediaQueryListEvent) => {
            setIsDarkTheme(event.matches);
        };
        mediaQueryList.addEventListener("change", handleMediaQueryChange);
        return () => {
            mediaQueryList.removeEventListener(
                "change",
                handleMediaQueryChange
            );
        };
    }, []);

    const toggleTheme = () => {
        setIsDarkTheme((prevIsDarkTheme) => !prevIsDarkTheme);
    };

    return (
        <ThemeContext.Provider value={{ isDarkTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
