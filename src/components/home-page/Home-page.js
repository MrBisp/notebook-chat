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
                    <img src="/hero.png" alt="hero" />
                </div>
                <div className={styles.container} style={{ "background": "rgba(0, 0, 0, 0.025)" }}>
                    <div className={styles.features}>
                        <h3>A simple notetaking app. With a twist.</h3>
                        <p className={styles.featuresText}>
                            Use Notebook Chat to take notes, and then use the power of AI to get insights, brainstorm and get feedback.
                        </p>

                        <div className={styles.featureSection}>
                            <div className={styles.featureTabs}>
                                {features.map((feature, index) => (
                                    <div key={index} className={`${styles.featureTab} ${activeFeature === index ? styles.active : ''}`} onClick={() => setActiveFeature(index)}>
                                        <h4>{feature.title}</h4>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.activeFeature}>
                                <h4>{features[activeFeature].title}</h4>
                                <p>{features[activeFeature].description}</p>
                            </div>
                        </div>

                    </div>
                </div>
                <div className={styles.container}>
                    <div className={styles.howItWorks}>
                        <h3>How it works</h3>
                        <div className={styles.howItWorksSection}>
                            <div className={styles.howItWorksStep}>
                                <div className={styles.howItWorksStepNumber}>1</div>
                                <div className={styles.howItWorksStepText}>
                                    <h4>Take notes</h4>
                                    <p>
                                        Take notes using the simple editor.
                                    </p>
                                </div>
                            </div>
                            <div className={styles.howItWorksStep}>
                                <div className={styles.howItWorksStepNumber}>2</div>
                                <div className={styles.howItWorksStepText}>
                                    <h4>Collaborate with the AI</h4>
                                    <p>
                                        Use the AI to get insights, brainstorm and get feedback.
                                    </p>
                                </div>
                            </div>
                            <div className={styles.howItWorksStep}>
                                <div className={styles.howItWorksStepNumber}>3</div>
                                <div className={styles.howItWorksStepText}>
                                    <h4>Ask the AI questions</h4>
                                    <p>
                                        Recall your notes by asking the AI questions.
                                    </p>
                                </div>
                            </div>

                        </div>

                    </div>
                </div>
                <div className={styles.spacer}></div>
            </div>
        </>
    )
}

export default HomePage