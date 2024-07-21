import styles from "./footer.module.css";

function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerText}>
                <h3>
                    © 2023 <a href="/">aiwillnotkillus.com</a> | v0.0.1 | Made
                    with 🤖 + ☕{" "}
                </h3>
                <p>
                    We strongly encourage employers to prioritize diversity,
                    equity, and inclusion as core values in their hiring
                    practices. Mitigating bias is of extreme importance for AI.
                </p>
            </div>
        </footer>
    );
}

export default Footer;
