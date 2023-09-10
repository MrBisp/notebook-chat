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
                    if (!authToken) {
                        router.replace('/login');
                    }
                }
            }
        }, [authToken, router, loading]);

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