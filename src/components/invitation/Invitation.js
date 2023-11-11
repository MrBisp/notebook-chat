import Head from 'next/head'
import { useState, useEffect, useContext, useRef, Fragment } from 'react';
import Link from 'next/link';
import { AuthContext } from '../../context/AuthContext';
import Page from '../page/Page';
import styles from './Invitation.module.css';
import { useRouter } from 'next/router';

const Invitation = ({ invitation, errorInvitation }) => {
    const { user, loading, track, login } = useContext(AuthContext);

    const [page, setPage] = useState(invitation?.page);
    const [viewOnlyMode, setViewOnlyMode] = useState(true);
    const [isLoading, setIsLoading] = useState(null);
    const [showRegister, setShowRegister] = useState(false);
    const [showLogin, setShowLogin] = useState(false);

    const [email, setEmail] = useState(null);
    const [password, setPassword] = useState(null);

    const [error, setError] = useState(null);
    const [errorRegister, setErrorRegister] = useState(null);
    const [loadingRegister, setLoadingRegister] = useState("");
    const [errorLogin, setErrorLogin] = useState(null);
    const [loadingLogin, setLoadingLogin] = useState("");

    const router = useRouter();

    useEffect(() => {
        if (invitation) {
            setPage(invitation.page);
        }
    }, [invitation]);

    const viewOnlyHandler = () => {
        track('Invitation view only', { page: page.title, url: window.location.href, invitation: invitation._id });
        setShowLogin(false);
        setShowRegister(false);
        setViewOnlyMode(true);
    }

    const acceptHandler = async () => {
        if (user) {
            setIsLoading("Giving you access to the page...");
            //Associate the user with the page
            const url = '/api/userpageaccess';
            const data = {
                invitationId: invitation._id,
                user: user.id,
            };
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            };

            const response = await fetch(url, options)
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        router.push(`/page/${page._id}`);
                    } else {
                        setError(data.message);
                        setIsLoading(null);
                    }
                });

            track('Invitation accepted, and user already logged in', { page: page.title, url: window.location.href, invitation: invitation._id });
        } else {
            setShowRegister(true);
        }
    }

    const registerHandler = async (e) => {
        e.preventDefault();
        setLoadingRegister("Creating your account...");

        if (!email || !password) {
            setErrorRegister("Please enter email and password");
            setLoadingRegister(null);
            return;
        }
        if (loadingRegister) return;

        //Let's first create the user, then associate the user with the page, and then log the user in
        try {
            // Call your API to register a new user
            const response = await fetch("/api/user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            console.log(data.data);
            console.log(data.data.email)

            // Check if the response is successful
            if (!data.data.email) {
                console.log("Something went wrong...");
                setErrorRegister("Something went wrong...");
                setLoadingRegister(null);
                return;
            }

            setLoadingRegister("Giving you access to the page...");

            //Associate the user with the page
            const url = '/api/userpageaccess';
            const data2 = {
                invitationId: invitation._id,
                user: data.data.id,
            };
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data2),
            };

            const response2 = await fetch(url, options);
            const data3 = await response2.json();
            if (!data3.success) {
                console.log("Something went wrong...");
                console.log(data3);
                setErrorRegister(data3.message);
                setLoadingRegister(null);
                return;
            }

            setLoadingRegister("Logging you in...");

            // Log the user in
            await login(data.data.email, data.data.password);

            setLoadingRegister("Redirecting you to the page...");


            //Redirect to the page
            track('Invitation accepted, and created new user', { page: page.title, url: window.location.href, invitation: invitation._id });
            router.push(`/page/${page._id}`);
        } catch (error) {
            console.error("An unexpected error happened occurred:", error);
            setErrorRegister("An unexpected error happened occurred:", error.message);
            setLoadingRegister(null);
            return;
        }
    }

    const loginHandler = async (e) => {
        e.preventDefault();
        setLoadingLogin("Logging you in...");

        if (!email || !password) {
            setErrorLogin("Please enter email and password");
            setLoadingLogin(null);
            return;
        }
        if (loadingLogin) return;

        try {
            // Log the user in
            await login(email, password);
        } catch (error) {
            console.error("An unexpected error happened occurred:", error);
            setErrorLogin("An unexpected error happened occurred:", error.message);
            setLoadingLogin(null);
            return;
        }
    }

    useEffect(() => {
        if (!user) return;
        if (!loadingLogin) return;

        loginHandlerPart2();
    }, [user]);



    const loginHandlerPart2 = async () => {
        try {
            setLoadingLogin("Giving you access to the page...");

            //Associate the user with the page
            const url = '/api/userpageaccess';
            const data = {
                invitationId: invitation._id,
                user: user.id,
            };
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            };

            const response = await fetch(url, options);
            const data2 = await response.json();
            if (!data2.success) {
                console.log("Something went wrong...");
                console.log(data2);
                setErrorLogin(data2.message);
                setLoadingLogin(null);
                return;
            }

            setLoadingLogin("Redirecting you to the page...");

            //Redirect to the page
            track('Invitation accepted, and user already logged in', { page: page.title, url: window.location.href, invitation: invitation._id });
            router.push(`/page/${page._id}`);

        } catch (error) {
            console.error("An unexpected error happened occurred:", error);
            setErrorLogin("An unexpected error happened occurred:", error.message);
            setLoadingLogin(null);
            return;
        }
    }

    //Ref if the user has tracked page view before
    const trackedPageView = useRef(false);

    useEffect(() => {

        //Check if the user is logged in after we are done loading
        if (!loading && user) {
            //router.push('/login');
        }
    }, []);


    useEffect(() => {
        if (typeof window !== 'undefined' && !trackedPageView.current && invitation) {
            trackedPageView.current = true;
            track('Pageview', { page: 'Invitation', url: window.location.href, invitation: invitation._id });
        }
    }, []);


    return (
        <>
            <Head>
                <title>{page?.title} | Notebook-chat.com</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon-192.png" />
                <meta name="robots" content="noindex" />
            </Head>
            <div className={styles.container}>
                <div className={styles.bg} style={{ 'filter': viewOnlyMode ? 'blur(0px)' : 'blur(5px)' }}>
                    <h1>{page?.title}</h1>
                    <div className={styles.page} dangerouslySetInnerHTML={{ __html: page?.content }}></div>
                </div>
                {
                    !viewOnlyMode && !errorInvitation && !isLoading && !showRegister && !showLogin && (
                        <div className={styles.content}>
                            <h1 className={styles.title}>You have been invited to collaborate on a shared note!</h1>
                            {
                                user && (
                                    <p>
                                        You are logged in as {user.email}. Click the button below to accept the invitation.
                                    </p>
                                )
                            }
                            {
                                !user && (
                                    <p>
                                        Create a free account to start collaborating in seconds! Or view it in read-only mode if you don't want to create an account.
                                    </p>
                                )
                            }
                            <div className={styles.buttons}>
                                <button className={styles.acceptbutton} onClick={acceptHandler}>Accept invitation</button>
                                <button className={styles.viewonly} onClick={viewOnlyHandler}>View in read-only mode</button>
                            </div>
                            {
                                error && (
                                    <div className={styles.error}>
                                        {error}
                                    </div>
                                )
                            }
                        </div>
                    )
                }
                {
                    errorInvitation && (
                        <div className={styles.content}>
                            <h1 className={styles.title}>Invitation not found</h1>
                            <p className={styles.description}>
                                The invitation you are trying to access does not exist or has expired.
                            </p>
                            <p>
                                Please contact the person who invited you to get a new invitation.
                            </p>
                        </div>
                    )
                }
                {
                    isLoading && (
                        <div className={styles.content} style={{ 'animation': 'none' }}>
                            <h1 className={styles.title}>{isLoading}</h1>
                        </div>
                    )
                }
                {
                    showRegister && (
                        <div className={styles.content} style={{ 'animation': 'none' }}>
                            <h1 className={styles.title}>Create an account to get access</h1>
                            <form className={styles.form} onSubmit={registerHandler}>
                                <label>
                                    Email:
                                    <input type="email" onChange={(e) => setEmail(e.target.value)} />
                                </label>
                                <label>
                                    Password:
                                    <input type="password" onChange={(e) => setPassword(e.target.value)} />
                                </label>
                                <span className={styles.showLoginButton} onClick={() => {
                                    setShowRegister(false);
                                    setShowLogin(true);
                                }}>Already have an account? Log in</span>
                                <button className={styles.acceptbutton} type="submit">Create account</button>
                            </form>
                            <span className={styles.cancel} onClick={() => setShowRegister(false)}>Cancel</span>
                            <button className={styles.viewonly} onClick={viewOnlyHandler}>View in read-only mode</button>
                            {
                                loadingRegister && (
                                    <div className={styles.loading}>
                                        {loadingRegister}
                                    </div>
                                )
                            }
                            {
                                errorRegister && (
                                    <div className={styles.error}>
                                        {errorRegister}
                                    </div>
                                )
                            }
                        </div>
                    )
                }

                {
                    showLogin && (
                        <div className={styles.content} style={{ 'animation': 'none' }}>
                            <h1 className={styles.title}>Log in to get access</h1>
                            <form className={styles.form} onSubmit={loginHandler}>
                                <label>
                                    Email:
                                    <input type="email" onChange={(e) => setEmail(e.target.value)} />
                                </label>
                                <label>
                                    Password:
                                    <input type="password" onChange={(e) => setPassword(e.target.value)} />
                                </label>
                                <span className={styles.showLoginButton} onClick={() => {
                                    setShowRegister(true);
                                    setShowLogin(false);
                                }}>Don't have an account? Create one</span>
                                <button className={styles.acceptbutton} type="submit">Log in</button>
                            </form>
                            <span className={styles.cancel} onClick={() => setShowLogin(false)}>Cancel</span>
                            {
                                loadingLogin && (
                                    <div className={styles.loading}>
                                        {loadingLogin}
                                    </div>
                                )
                            }
                            {
                                errorLogin && (
                                    <div className={styles.error}>
                                        {errorLogin}
                                    </div>
                                )
                            }
                        </div>
                    )
                }

                {
                    viewOnlyMode && (
                        <div className={styles.bottomContainer}>
                            <div className={styles.bottom}>
                                <div className={styles.bottomText}>
                                    <span>
                                        Sign up for a free account to edit this note and collaborate with others.
                                    </span>
                                </div>
                                <div className={styles.buttons}>
                                    <button className={styles.acceptbutton} onClick={() => {
                                        setViewOnlyMode(false);
                                        if (user) {
                                            acceptHandler();
                                        } else {
                                            setShowRegister(true);
                                        }
                                    }}>Edit note</button>
                                </div>
                            </div>
                        </div>
                    )
                }

            </div>

        </>
    )
}

export default Invitation;