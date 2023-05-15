import styles from './LoadingSpinner.module.css'

export default function LoadingSpinner() {
    return (
        <>
            <br />
            <div className={styles.ldsRing}>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
        </>

    );
}