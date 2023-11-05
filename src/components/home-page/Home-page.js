import Head from 'next/head'
import { useState, useEffect, useContext, useRef } from 'react';
import Link from 'next/link';
import { AuthContext } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import styles from './Home-page.module.css';
import poppins from '../../../utils/font';

const HomePage = () => {
    const { user, loading, track } = useContext(AuthContext);

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
        {
            title: 'Continue writing',
            description: 'Just write \'+++\' and the AI will continue your sentence. It\'s like autocomplete, but for your thoughts.',
            image: '/feature-1.png'
        }, {
            title: 'Ask the AI to do anything',
            description: 'Ask the AI to summarize, translate or whatever you want.',
            image: '/feature-2.png'
        }, {
            title: 'Discuss your notes',
            description: 'No more copy-pasting to ChatGPT. Open the sidebar and start chatting about your notes.',
            image: '/feature-3.png'
        }, /*{
            title: 'Automatically find related notes',
            description: 'As you write, the AI will automatically find related notes, to help you see new patterns and connections.',
            image: '/feature-4.png'
        }, */{
            title: 'A truly personal AI',
            description: 'Provide the AI with context about you, and it will use it to give you better answers',
            image: '/feature-5.png'
        },
        {
            title: 'Real-time collaboration',
            description: 'Collaborate with your friends in real-time, just like Google Docs.',
            image: '/feature-6.png'
        }
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
                <title>Notebook-chat.com - AI-powered note taking</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon-192.png" />
            </Head>
            <div className={styles.navbar + ' ' + poppins.className}>
                <div className={styles.logo}>Notebook Chat</div>
                <div className={styles.navbarLinks}>
                    <Link href="/login">Login</Link>
                </div>
            </div>
            <div className={styles.homeContainer}>
                <div className={styles.hero}>
                    <h1>Write notes, with AI by your side</h1>
                    <h2>Let the AI help you write, recall and discuss your notes. All without leaving your notes app.</h2>
                    <Link href="/register">Get started</Link>
                    <video autoPlay loop muted playsInline >
                        <source src="/hero-video-cropped.mp4" type="video/mp4" />
                    </video>
                </div>
                <div className={styles.container} style={{ "background": "rgba(255,255,255,0.8)" }}>
                    <div className={styles.features}>
                        <h2>More than just a notes app</h2>
                        <p>
                            Notebook-Chat's AI understands you, and helps you recall your notes, discuss ideas, and stay organized.
                        </p>

                        <div className={styles.featureList}>
                            {features.map((feature, index) => (
                                <div key={index} className={styles.feature}>
                                    <div className={styles.featureImage}>
                                        <img src={feature.image} />
                                    </div>
                                    <div className={styles.featureText}>
                                        <h3>{feature.title}</h3>
                                        <p>{feature.description}</p>
                                    </div>
                                </div>
                            ))}

                        </div>
                    </div>
                </div>
                <div className={styles.container}>
                    <div className={styles.simpleText}>
                        <h2>Made for knowledge workers</h2>
                        <p>
                            The idea behind Notebook-Chat is simple: we all use ChatGPT in our work, but it lacks knowledge about us.
                        </p>
                        <p>
                            That's why Notebook-Chat was built from the ground up to understand you, and help you in your work.
                        </p>
                        <p>
                            Unlike other note taking apps, Notebook-Chat was built as AI-first design, meaning that we don't just think about AI as an afterthought, but as a core part of the product.
                        </p>
                        <p>
                            - Frederik Bisp <br />
                            Founder of Notebook-Chat
                        </p>
                    </div>
                </div>
                <div className={styles.container} style={{ "background": "rgba(255,255,255,0.8)" }}>
                    <h2>Pricing</h2>
                    <p>
                        Notebook-Chat is currently free 😊, but we will soon launch a paid plan.
                    </p>
                    <div className={styles.spacer} style={{ 'height': '50vh' }}></div>
                </div>

            </div>

        </>
    )
}

export default HomePage