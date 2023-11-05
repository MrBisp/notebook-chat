import React, { useEffect, useState } from "react";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import styles from "./WorkbookInvitation.module.css";
import { useRouter } from "next/router";
import Head from "next/head";

const WorkbookInvitation = ({ invitation, errorInvitation }) => {
    const router = useRouter();

    const { user, loading, track, login } = useContext(AuthContext);

    const [loadingMessage, setLoadingMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [loadingUser, setLoadingUser] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const acceptHandler = async () => {
        if (!user) {
            setShowRegister(true);
        } else {
            //If the user is already logged in, give them access to the workbook
            setLoadingMessage("Giving you access to the page...");

            const url = '/api/userworkbookaccess';
            const body = {
                invitationId: invitation._id,
                user: user.id
            };
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            }

            const response = await fetch(url, options);
            const data = await response.json();

            if (!data.success) {
                console.log("Something went wrong...");
                setErrorMessage("Something went wrong...");
                setLoadingMessage("");
                return;
            }

            // Redirect the user to the workbook
            setLoadingMessage("Redirecting you to the notebook...");

            track("Workbook Invitation Accepted", {
                workbookId: invitation.workbook._id,
                workbookTitle: invitation.workbook.title,
                userId: user._id,
                userEmail: user.email
            });

            router.push(`/notebook/${invitation.workbook._id}`);
        }
    }

    const registerHandler = async (e) => {
        e.preventDefault();
        setLoadingMessage("Creating account...");

        if (!email || !password) {
            setErrorMessage("Please enter an email and password.");
            setLoadingMessage("");
            return;
        }

        try {
            const response = await fetch("/api/user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            console.log(data.data);

            // Check if the response is successful
            if (!data.data.email) {
                console.log("Something went wrong...");
                setErrorMessage("Something went wrong...");
                setLoadingMessage("");
                return;
            }

            setLoadingMessage("Giving you access to the page...");

            // Give the user access to the workbook
            const url = '/api/userworkbookaccess';
            const body = {
                invitationId: invitation._id,
                user: data.data.id
            };
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            }

            const response2 = await fetch(url, options);
            const data2 = await response2.json();
            if (!data2.success) {
                console.log(data2);
                setErrorMessage("Something went wrong...");
                setLoadingMessage("");
                return;
            }

            // Log the user in
            setLoadingMessage("Logging you in...");

            await login(email, password);

            // Redirect the user to the workbook
            setLoadingMessage("Redirecting you to the notebook...");

            track("Workbook Invitation Accepted, and user created", {
                workbookId: invitation.workbook._id,
                workbookTitle: invitation.workbook.title,
                userId: data.data._id,
                userEmail: data.data.email
            });
            router.push(`/notebook/${invitation.workbook._id}`);
        } catch (error) {
            console.log(error);
            setErrorMessage("Something went wrong...");
            setLoadingMessage("");
            return;
        }
    }

    const loginHandler = async (e) => {
        e.preventDefault();
        if (loadingMessage) return;
        setLoadingMessage("Logging you in...");

        if (!email || !password) {
            setErrorMessage("Please enter an email and password.");
            setLoadingMessage("");
            return;
        }

        try {
            await login(email, password);
            setLoadingUser(true);
        } catch (error) {
            console.log(error);
            setErrorMessage("Something went wrong...");
            setLoadingMessage("");
            return;
        }
    }

    const loginHandlerPart2 = async () => {
        try {
            setLoadingMessage("Giving you access to the page...");

            // Give the user access to the workbook
            const url = '/api/userworkbookaccess';
            const body = {
                invitationId: invitation._id,
                user: user.id
            };
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            }

            const response2 = await fetch(url, options);
            const data2 = await response2.json();
            if (!data2.success) {
                console.log("Something went wrong...");
                setErrorMessage("Something went wrong...");
                setLoadingMessage("");
                return;
            }

            // Redirect the user to the workbook
            setLoadingMessage("Redirecting you to the notebook...");

            track("Workbook Invitation Accepted, and user logged in", {
                workbookId: invitation.workbook._id,
                workbookTitle: invitation.workbook.title,
                userId: user._id,
                userEmail: user.email
            });

            router.push(`/notebook/${invitation.workbook._id}`);

        } catch (error) {
            console.log(error);
            setErrorMessage("Something went wrong...");
            setLoadingMessage("");
            return;
        }
    }

    useEffect(() => {
        if (user && loadingUser) {
            loginHandlerPart2();
        }
    }, [user, loadingUser]);

    return (
        <>
            <Head>
                <title>Invitation to collaborate on a notebook! | Notebook-chat.com</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon-192.png" />
                <meta name="robots" content="noindex" />
            </Head>
            <div className={styles.container}>
                {errorInvitation && <div className="error">Your invitation is invalid or inspired. Ask the person that sent you the invitation, to invite you again.</div>}
                {invitation && !showRegister && !showLogin && (
                    <div className={styles.content}>
                        <h1>Workbook Invitation</h1>
                        <p>You've been invited to collaborate on <strong>{invitation.workbook.title}</strong>.</p>
                        <p>Click the button below to accept the invitation.</p>
                        {user && (<p>You are currently logged in as {user.email}</p>)}
                        <button className={styles.acceptbutton} onClick={acceptHandler}>Accept Invitation</button>
                        {loadingMessage && <div className="loading">{loadingMessage}</div>}
                    </div>
                )}
                {
                    showRegister && (
                        <div className={styles.content}>
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
                            {
                                loadingMessage && (
                                    <div className={styles.loading}>
                                        {loadingMessage}
                                    </div>
                                )
                            }
                            {
                                errorMessage && (
                                    <div className={styles.error}>
                                        {errorMessage}
                                    </div>
                                )
                            }
                        </div>
                    )
                }
                {
                    showLogin && (
                        <div className={styles.content}>
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
                                loadingMessage && (
                                    <div className={styles.loading}>
                                        {loadingMessage}
                                    </div>
                                )
                            }
                            {
                                errorMessage && (
                                    <div className={styles.error}>
                                        {errorMessage}
                                    </div>
                                )
                            }
                        </div>
                    )
                }
            </div>
        </>
    )
}

export default WorkbookInvitation;