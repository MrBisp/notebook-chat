// components/withAuth/withAuth.js

import { useRouter } from 'next/router';
import React, { useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const withAuth = (WrappedComponent) => {
    const Wrapper = (props) => {
        const router = useRouter();
        const { authToken, user, login, logout, loading } = useContext(AuthContext);

        useEffect(() => {
            console.log('Running withAuth effect')
            if (!loading) {
                if (typeof window !== 'undefined') {
                    if (!authToken) {
                        console.log('No auth token, redirecting to login')
                        router.replace('/login');
                    } else {
                        console.log('User:')
                        console.log(user);
                    }
                }
            }
        }, [authToken, router, loading]);

        //Describe what is going on next
        //If we are loading or there is no auth token, return an empty fragment
        if (loading || !authToken) {
            return <>
                <p>Loading...</p>
            </>;
        }

        return (
            <WrappedComponent {...props} user={user} authToken={authToken} login={login} logout={logout} />
        );
    };

    return Wrapper;
};

export default withAuth;