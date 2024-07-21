import { isValidEmail, isValidEmailOrURL, isValidURL } from "./field-validation";
import { JobsRecord } from "../../types/pocketbase-types";
import PocketBase from "pocketbase";

const pb = new PocketBase(process.env.REACT_APP_PB_URL);

export const getRecord = async (
    amount: number,
    jobsFormData: JobsRecord,
    company_logo: File | undefined
) => {
    const formData = new FormData();

    // Company and Job Title
    formData.append("company", jobsFormData.company ?? "");
    formData.append("title", jobsFormData.title ?? "");

    // Update/Created At Time
    formData.append("updated_ats", jobsFormData.updated_ats ?? "");

    // Remote
    formData.append("remote", jobsFormData.remote ?? "");

    // Tags and Country
    jobsFormData.tags?.forEach((tag) => {
        formData.append("tags", tag);
    });
    jobsFormData.country?.forEach((country) => {
        formData.append("country", country);
    });

    // Salary
    formData.append("min_salary", jobsFormData.min_salary ?? "");
    formData.append("max_salary", jobsFormData.max_salary ?? "");

    // Apply Link (with email/url validation)
    let applyLink = jobsFormData.apply_link ?? "";
    if (isValidEmail(applyLink)) {
        applyLink = `mailto:${applyLink}?subject=Application for ${jobsFormData.title} at ${jobsFormData.company} &body=\
        Redirected from aiwillnotkillus.com. Please let us know where you applied from.`;
        formData.append("apply_link", applyLink);
    } else if (isValidURL(applyLink)) {
        applyLink = `${applyLink}?ref=aiwnku`;
        formData.append("apply_link", applyLink);
    }

    // Company Logo
    if (company_logo) {
        formData.append("logo", company_logo);
    }

    // Paid Flag
    formData.append("paid", (jobsFormData.paid ?? "").toString());

    // Create Job Record & Backup in PocketBase
    formData.append("post_type", "featured");
    const postedJob = await pb.collection("jobs").create(formData);

    // Return Record Object
    return {
        amount: amount,
        id: postedJob.id,
    };
};
