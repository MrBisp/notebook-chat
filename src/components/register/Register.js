// pages/register.js

import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useRouter } from "next/router";
import Link from "next/link";

const RegisterPage = () => {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();

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


    };

    return (
        <div className='login-container'>
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
            <p style={{ color: "red" }}>{error}</p>
            <p>
                Already have an account? <Link href="/login">Login</Link>
            </p>
        </div>
    );
};

export default RegisterPage;
