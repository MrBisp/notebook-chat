// Login.js

import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import poppins from '../../../utils/font';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const { login, authToken, track } = useContext(AuthContext);

    const [loading, setLoading] = useState(false);

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
            track('Login', {});
            router.replace('/chat');
        }
    }, [authToken]);

    return (
        <div className={'login-container ' + poppins.className} >
            <h1>Login</h1>
            <h5>
                Log in to use Notebook Chat!
            </h5>
            <form onSubmit={(e) => {
                handleSubmit(e);
                setLoading(true);
            }}>
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
                {
                    loading && (
                        <p>
                            Logging you in...
                        </p>
                    )
                }
            </form>
            {errorMessage && <p>{errorMessage}</p>}
            <span>
                Don't have an account? <a href="/register">Sign up</a>
            </span>
        </div>
    );
};

export default Login;
