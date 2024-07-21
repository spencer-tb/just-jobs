import styles from "./recruiter-column.module.css";

const RecruiterColumn = () => {
    const logos = [
        "images/recruiter-logos/openai.svg",
        "images/logo_bad.png",
        "images/recruiter-logos/openai.svg",
        "images/logo_bad.png",
        "images/recruiter-logos/openai.svg",
        "images/logo_bad.png",
    ];

    return (
        <div className={styles.recruiterColumn}>
            <div className={styles.recruiterColumnLogosWrapper}>
                <h2>We Post Jobs From</h2>
                <div className={styles.recruiterColumnLogos}>
                    {logos.map((logo, index) => (
                        <div className={styles.logoContainer} key={index}>
                            <img
                                src={logo}
                                className={styles.recruiterColumnLogo}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.recruiterColumnCta}>
                <p>
                    AI WILL NOT KILL US is one of the world’s leading AI and
                    remote job boards. We are used by millions of global and
                    remote workers, and trusted by leading AI companies - large
                    and small - and recruiters.
                </p>
                <p>
                    Beginning a long-term relationship with you is important to
                    us. For your first 90 days with AI WILL NOT KILL US, every
                    time you place 1 job ad you will get 1 free. Place 2 job ads
                    and you will get 3 free.
                </p>
                <p>
                    We’re obsessed with giving value. You should expect at least
                    1500 eyeballs and 175 clicks for every job you post. Should
                    we ever fall below that high standard, you will be credited
                    accordingly
                </p>
                <h2>FAQs</h2>
                <h3>How long will my job be posted on this site?</h3>
                <p>
                    Your job will be live and prominently displayed for 30 days.
                </p>

                <h3>How much will it cost?</h3>
                <p>
                    On AI Will Not Kill Us you can set your own budget. The more
                    you spend, the higher your job ad will appear on our list.
                    Minimum spend is $69, but we recommend setting the budget
                    above $200 to ensure your ad is prominent on our list. For
                    your first 90 days with us, we give you 2 free ads for every
                    1 ad you place, and 3 free ads when you buy 2.
                </p>

                <h3>Who runs AIWINKUS?</h3>
                <p>
                    Spencer, Sakib, and Dan have backgrounds in AI, Machine
                    Learning, and information technology. Between them, they
                    have worked for Apple, Amazon, Facebook, FedEx, Ethereum and
                    have broad corporate, freelance, and digital nomad
                    experience. 25% of AI WILL NOT KILL US profits will provide
                    opportunities for working-class kids to learn and build
                    careers in AI.
                </p>
            </div>
        </div>
    );
};

export default RecruiterColumn;
