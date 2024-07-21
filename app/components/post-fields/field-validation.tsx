import { JobsRecord } from "../../types/pocketbase-types";

export const isValidEmail = (email: string) => {
    const emailRegex = /^.+@.+\..+$/;
    return emailRegex.test(email);
};

export const isValidURL = (url: string) => {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
};

export const isValidEmailOrURL = (input: string) => {
    return isValidEmail(input) || isValidURL(input);
};

export const checkRequiredFieldsFilled = (jobsFormData: JobsRecord) => {
    const requiredFields = ["company", "title"] as const;

    // Check every required field
    for (const field of requiredFields) {
        if (!jobsFormData[field as keyof JobsRecord]) {
            return `Please fill the ${field} field correctly.`;
        }
    }

    // Return empty message if all required fields are filled
    return "";
};
