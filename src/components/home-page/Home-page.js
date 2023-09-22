import Head from 'next/head'
import { useState, useEffect, useContext, useRef } from 'react';
import Link from 'next/link';
import { AuthContext } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import styles from './Home-page.module.css';
import poppins from '../../../utils/font';

const HomePage = () => {
    const { user, loading, track } = useContext(AuthContext);
    const [activeFeature, setActiveFeature] = useState(0);

    //Ref if the user has tracked page view before
    const trackedPageView = useRef(false);


    const router = useRouter();

    useEffect(() => {
        //Check if the user is logged in after we are done loading
        if (!loading && user) {
            console.log('User is not logged in, redirecting to login page');
            router.push('/login');
        }
    }, []);

    const features = [
        { title: 'Deep knowledge', description: 'Notebook Chat uses the latest AI to understand your notes, and recall them when you need them. It\'s basically like having infinite memory.' },
        { title: 'Simple to use', description: 'Do you want customizable tables, expandable texts, and other fancy stuff? Then Notebook Chat is not for you. Notebook Chat is simple, and that\'s the way we like it.' },
        { title: 'Always accessible', description: 'Notebook Chat is available on all your devices, so you can access your notes anywhere, anytime.' },
        { title: 'Stay organized', description: 'Notebook Chat provides you with the ability to efficiently organize your notes by creating notebooks, ensuring your information is well-structured and easily accessible.' }
    ]

    useEffect(() => {
        if (typeof window !== 'undefined' && !trackedPageView.current) {
            trackedPageView.current = true;
            track('Pageview', { page: 'Home page', url: window.location.href });
        }
    }, []);


    return (
        <>
            <Head>
                <title>Notebook-chat.com - Your personal knowledge partner</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className={styles.navbar + ' ' + poppins.className}>
                <div className={styles.logo}>Notebook Chat</div>
                <div className={styles.navbarLinks}>
                    <span>Pricing</span>
                    <span>Features</span>
                    <span>Demo</span>
                    <Link href="/login">Login</Link>
                </div>
            </div>
            <div className={styles.homeContainer}>
                <div className={styles.hero}>
                    <h1>Your Personal Knowledge Partner</h1>
                    <h2>Notebook Chat allows you to chat about your notes using AI with deep understanding.</h2>
                    <Link href="/register">Get Brain-superpowers</Link>
                    <img src="/hero-macbook.png" alt="hero" />
                </div>
                <div className={styles.container} style={{ "background": "rgba(0, 0, 0, 0.025)" }}>
                    <div className={styles.features}>
                        <span className={styles.smallTextAboveHeader}>Features</span>
                        <h2>A simple notes app with a twist</h2>
                        <p>
                            Focus on writing notes,
                        </p>



                    </div>
                    <div className={styles.spacer}></div>
                </div>
            </div>

        </>
    )
}

export default HomePage