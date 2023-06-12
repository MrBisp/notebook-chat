import Head from 'next/head'
import Workbook from '@/components/workbook/Workbook';
import { useState, useEffect } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../../../context/AuthContext'
import withAuth from '../../../components/withAuth/WithAuth';
import { useRouter } from 'next/router';
import Link from 'next/link';

const WorkbookPage = () => {
    const { workbooks, addWorkbook } = useContext(AuthContext);

    const router = useRouter();
    const { id } = router.query;

    return (
        <>
            <Head>
                <title>Notebook chat</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Workbook workbookId={id} />
        </>
    )
}

export default withAuth(WorkbookPage);