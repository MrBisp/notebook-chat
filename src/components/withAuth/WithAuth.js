// components/withAuth/withAuth.js

import { useRouter } from 'next/router';
import React, { useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const withAuth = (WrappedComponent) => {
    const Wrapper = (props) => {
        const router = useRouter();
        const { authToken, user, login, logout, loading } = useContext(AuthContext);

        useEffect(() => {
            if (!loading) {
                if (typeof window !== 'undefined') {
                    if (!authToken && router) {
                        console.log('No auth token, redirecting to login')
                        router.replace('/login');
                    }
                } else {
                    console.log('User:')
                    console.log(user);
                }
            }

        }, [authToken, router, loading]);

        if (loading || !authToken) {
            return <></>;
        }

        return (
            <WrappedComponent {...props} user={user} authToken={authToken} login={login} logout={logout} />
        );
    };

    return Wrapper;
};

export default withAuth;