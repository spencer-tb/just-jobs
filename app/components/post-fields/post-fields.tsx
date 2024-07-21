"use client";

import { useState } from "react";
import {
    JobsCountryOptions,
    JobsRecord,
    JobsRemoteOptions,
    JobsTagsOptions,
} from "../../types/pocketbase-types";
import TextField from "../../forms/common/text-field";
import CheckoutButton from "./checkout-button";
import ReactSelectField from "../../forms/common/react-select-field";
// import SalaryRangeSlider from "../../forms/common/SalarySlider";

import styles from "./post-fields.module.css";

function PostFields() {
    const [jobsFormData, setJobsFormData] = useState<JobsRecord>({
        title: "",
        company: "",
        logo: "",
        remote: JobsRemoteOptions["💻 Remote"],
        country: [JobsCountryOptions["🌎 Worldwide"]],
        location: "",
        min_salary: "",
        max_salary: "",
        apply_link: "",
        tags: [JobsTagsOptions["🧠 AI"]],
        updated_ats: new Date().toISOString(),
        id_ats: "",
        commitment: "",
        region: "",
        company_url: "",
        paid: false,
    });

    const [companyLogo, setCompanyLogo] = useState<File>();
    const handleCompanyLogoChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (file) {
            setCompanyLogo(file);
            console.log(file);
        }
    };

    return (
        <div className={styles.forms}>
            <div className={styles.job_details}>
                <h1>Job Details</h1>

                {/* Company Name - Text Form */}
                <div className={styles.company_name}>
                    <div className={styles.label}>
                        <p>👥 Company Name*</p>
                    </div>
                    <TextField
                        textArea={false}
                        onChange={(text) =>
                            setJobsFormData({
                                ...jobsFormData,
                                company: text,
                            })
                        }
                    />
                </div>

                {/* Job Title - Text Form */}
                <div className={styles.job_title}>
                    <div className={styles.label}>
                        <p>💼 Position*</p>
                    </div>
                    <TextField
                        textArea={false}
                        onChange={(text) =>
                            setJobsFormData({
                                ...jobsFormData,
                                title: text,
                            })
                        }
                    />
                </div>

                <div className={styles.skills}>
                    <div className={styles.label}>
                        <p>🔧 Skills & Tags </p>
                        <span className={styles.label_extra}>
                            (maximum 3 in order of relevance){" "}
                        </span>
                    </div>
                    <ReactSelectField
                        jobEnums={JobsTagsOptions}
                        isMulti={true}
                        maxValues={10}
                        className={styles.react_select}
                        defaultValue={"🧠 AI"}
                        onChange={(values) => {
                            setJobsFormData({
                                ...jobsFormData,
                                tags: [...values].map(
                                    ({ value }) => value as JobsTagsOptions
                                ),
                            });
                        }}
                    />
                </div>

                {/* Locations - Multiple Select Form */}
                <div className={styles.locations}>
                    <div className={styles.label}>
                        <p>📍 Remote* </p>
                    </div>
                    <ReactSelectField
                        jobEnums={JobsRemoteOptions}
                        isMulti={false}
                        maxValues={1}
                        className={styles.react_select}
                        defaultValue={"Select Remote"}
                        onChange={(values) => {
                            setJobsFormData({
                                ...jobsFormData,
                                remote: values
                                    ? values.map(
                                          ({ value }) =>
                                              value as JobsRemoteOptions
                                      )
                                    : [],
                            });
                        }}
                    />
                </div>

                {/* Locations - Multiple Select Form */}
                <div className={styles.locations}>
                    <div className={styles.label}>
                        <p>📍 Location* </p>
                        <span className={styles.label_extra}>
                            (maximum 2 locations){" "}
                        </span>
                    </div>
                    <ReactSelectField
                        jobEnums={JobsCountryOptions}
                        isMulti={true}
                        maxValues={2}
                        className={styles.react_select}
                        defaultValue={"🌎 Worldwide"}
                        onChange={(values) => {
                            setJobsFormData({
                                ...jobsFormData,
                                country: [...values].map(
                                    ({ value }) => value as JobsCountryOptions
                                ),
                            });
                        }}
                    />
                </div>

                {/* Company Logo - File Upload */}
                <div className={styles.company_logo}>
                    <div className={styles.label}>
                        <p>🖼️ Company Logo*</p>
                    </div>
                    <input
                        type="file"
                        id="fileInput"
                        onChange={handleCompanyLogoChange}
                    />
                </div>

                {/* Apply Link - Text Form */}
                <div className={styles.apply_link}>
                    <div className={styles.label}>
                        <p>🔗 Apply Link or Email*</p>
                    </div>
                    <TextField
                        textArea={false}
                        onChange={(text) =>
                            setJobsFormData({
                                ...jobsFormData,
                                apply_link: text,
                            })
                        }
                    />
                </div>

                {/* Feedback - Text Form */}
                <div className={styles.feedback}>
                    <div className={styles.label}>
                        <span className={styles.label_extra}></span>
                    </div>
                </div>
            </div>

            <div className={styles.checkout_button_wrapper}>
                <CheckoutButton
                    jobsFormData={jobsFormData}
                    company_logo={companyLogo}
                />
            </div>
        </div>
    );
}

export default PostFields;
