// Login.js

import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import poppins from '../../../utils/font';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const { login, authToken } = useContext(AuthContext);

    const router = useRouter();

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await login(username, password);
            if (!response) {
                setErrorMessage(response.message);
                return;
            }
        } catch (error) {
            setErrorMessage("Something went wrong");
        }
    };

    useEffect(() => {
        if (authToken) {
            console.log(authToken)
            router.replace('/notebook');
        }
    }, [authToken]);

    return (
        <div className={'login-container ' + poppins.className} >
            <h1>Login</h1>
            <h5>
                Log in to use Notebook Chat!
            </h5>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                </div>
                <button type="submit">Login</button>
            </form>
            {errorMessage && <p>{errorMessage}</p>}
            <span>
                Don't have an account? <a href="/register">Sign up</a>
            </span>
        </div>
    );
};

export default Login;
