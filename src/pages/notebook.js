import Head from 'next/head'
import Workbook from '@/components/workbook/Workbook';
import { useState, useEffect } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import withAuth from '../components/withAuth/WithAuth';
import { useRouter } from 'next/router';

const NotebookComponent = () => {
    const { user, authToken, logout, loading } = useContext(AuthContext);

    const router = useRouter();

    return (
        <>
            <Head>
                <title>Chat and notebook</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main>
                <div className="main-container">
                    <Workbook />
                </div>
            </main>
        </>
    )
}

export default withAuth(NotebookComponent);