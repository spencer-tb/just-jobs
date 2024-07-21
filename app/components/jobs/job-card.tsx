import { JobsResponse } from "../../types/pocketbase-types";
import { getJobImgUrl, getLastUpdated } from "./helpers";
import styles from "./jobs.module.css";

const JobCard = ({ job }: { job: JobsResponse }) => {
    let formattedTitle = job.title;
    if (job.title && window.innerWidth > 600 && job.title.length > 50) {
        formattedTitle = job.title.slice(0, 50) + "...";
    }
    return (
        <div className={styles.jobCard}>
            {/* Optional: Company Logo */}
            <div className={styles.logo}>
                <img src={getJobImgUrl(job)} />
            </div>
            {/* Basic Job Post Info */}
            <div className={styles.info}>
                <div className={styles.title}>
                    <a href={job.apply_link} target="_blank">
                        {formattedTitle}
                    </a>
                </div>
                <div className={styles.company}>
                    <a href={job.company_url} target="_blank">
                        {job.company}
                    </a>
                </div>
                <div className={styles.tags}>
                    {/* Remote location/s */}
                    {job.country && job.country.length > 0 && (
                        <div className={styles.tagItem}>
                            {job.country.map((country, index) => (
                                <span key={index}>{country}</span>
                            ))}
                        </div>
                    )}
                    {/* Job Tags */}
                    {job.tags &&
                        job.tags
                            .filter((tag) => tag.length > 1 && tag !== "🧠 AI")
                            .slice(0, 4)
                            .map((tag, index) => (
                                <div className={styles.tagItem} key={index}>
                                    {tag.slice(2)}
                                </div>
                            ))}
                    {/* Optional: Salary */}
                    {job.min_salary && job.max_salary && (
                        <div className={styles.tagItem}>
                            <span>
                                💸 {job.min_salary}
                                {"-"}
                                {job.max_salary}
                            </span>
                        </div>
                    )}
                </div>
            </div>
            {/* Last Updated (Time Posted) */}
            <div className={styles.lastUpdated}>
                {getLastUpdated(job.updated_ats)}
            </div>
        </div>
    );
};

export default JobCard;
