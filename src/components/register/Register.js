// pages/register.js

import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useRouter } from "next/router";
import Link from "next/link";
import poppins from "../../../utils/font";

const RegisterPage = () => {
    const { login, track } = useContext(AuthContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please enter email and password');
            return;
        }
        if (loading) return;
        setLoading(true);

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
            if (data.data.email) {
                // Log the user in
                track('User registered', { email: data.data.email });
                login(data.data.email, data.data.password);
                // Redirect them to the home page
                router.push("/notebook");
            } else {
                console.log("Something went wrong...");
                setError("Something went wrong...");
            }
        } catch (error) {
            console.error("An unexpected error happened occurred:", error);
            setError("An unexpected error happened occurred:", error.message);
        }
        setLoading(false);
    };

    return (
        <div className={'login-container ' + poppins.className} >
            <div className='login-left'>
                <form onSubmit={handleSubmit}>
                    <h1>Register</h1>
                    <label>
                        Email:
                        <input type="email" onChange={(e) => setEmail(e.target.value)} />
                    </label>
                    <label>
                        Password:
                        <input type="password" onChange={(e) => setPassword(e.target.value)} />
                    </label>
                    <button type="submit">Submit</button>
                    {
                        loading && <p>Loading...</p>
                    }
                </form>
                <p style={{ color: "red" }}>{error}</p>
                <p>
                    Already have an account? <Link href="/login">Login</Link>
                </p>
            </div>
            <div className='login-right'>
                <img src='/login.png' alt='login' />
            </div >
        </div>
    );
};

export default RegisterPage;
