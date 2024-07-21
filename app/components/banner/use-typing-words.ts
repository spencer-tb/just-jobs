"use client";

import { useEffect, useState } from "react";
import { homeWords, postAJobWords } from './typing-words';

import { PageType } from "../../types/enums";

interface TypingEffectProps {
    type?: PageType;
    initialDelay?: number;
}

const useTypingEffect = ({ type, initialDelay = 2000 }: TypingEffectProps) => {
    const [displayedText, setDisplayedText] = useState("");

    const words = 
        type === PageType.HOME ? homeWords :
        type === PageType.POST ? postAJobWords : [];

    useEffect(() => {
        if (!words.length) return;
        let isCancelled = false;

        const typingDelay = 35;
        const deleteLetterDelay = typingDelay;
        const nextWordDelay = 500;
        const endTypingDelay = 6000;
        let currentWordIndex = 0;

        const delay = (ms: number) =>
            new Promise((resolve) => setTimeout(resolve, ms));

        const typeLetter = async (textIndex: number) => {
            if (isCancelled) return;

            const currentWord = words[currentWordIndex];
            setDisplayedText(currentWord.slice(0, textIndex));

            const nextIndex = textIndex + 1;

            if (nextIndex <= currentWord.length) {
                await delay(typingDelay);
                await typeLetter(nextIndex);
            } else {
                await delay(endTypingDelay);
                await deleteLetter(currentWord.length);
            }
        };

        const deleteLetter = async (textIndex: number) => {
            if (isCancelled) return;

            const currentWord = words[currentWordIndex];
            setDisplayedText(currentWord.slice(0, textIndex));

            const nextIndex = textIndex - 1;

            if (nextIndex >= 0) {
                await delay(deleteLetterDelay);
                await deleteLetter(nextIndex);
            } else {
                await delay(nextWordDelay);
                currentWordIndex = (currentWordIndex + 1) % words.length;
                await typeLetter(0);
            }
        };

        setDisplayedText(words[0]);
        delay(initialDelay).then(() => typeLetter(words[0].length));
        return () => {
            isCancelled = true;
        };
    }, [words]);

    return displayedText;
};

export default useTypingEffect;
