import Header from "../components/header/header";
import PostFields from "../components/post-fields/post-fields";
import Banner from "../components/banner/banner";
import RecruiterColumn from "../components/recruiter-column/recruiter-column";
import styles from "./post-a-job.module.css";

function PostAJob() {
    return (
        <div>
            <Header isHomePage={false} />
            <div className={styles.page}>
                <div className={styles.leftColumn}>
                    <Banner isHomePage={false} isPostPage={true} />
                    <PostFields />
                </div>
                <div className={styles.rightColumn}>
                    <RecruiterColumn />
                </div>
            </div>
        </div>
    );
}

export default PostAJob;
