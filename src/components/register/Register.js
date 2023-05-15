// pages/register.js

import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useRouter } from "next/router";
import Link from "next/link";

const RegisterPage = () => {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Call your API to register a new user
        const response = await fetch("/api/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();

        if (data.authToken) {
            // Log the user in
            login(data.user, data.authToken);
            // Redirect them to the home page
            router.push("/");
        } else {
            console.error("Error: ", data.error);
            // Show error message to the user (e.g., using an alert or in the UI)
        }
    };

    return (
        <>
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
            </form>
            <p>
                Already have an account? <Link href="/login">Login</Link>
            </p>
        </>
    );
};

export default RegisterPage;
