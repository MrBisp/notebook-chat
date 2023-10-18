import Head from 'next/head'
import Workbook from '@/components/workbook/Workbook';
import Page from '@/components/page/Page';
import { useState, useEffect } from 'react';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext'
import withAuth from '@/components/withAuth/WithAuth'
import { useRouter } from 'next/router';
import Link from 'next/link';
import Main from '@/components/main/Main';

const PageRoute = () => {
    const { authToken } = useContext(AuthContext);

    const router = useRouter();
    const { id } = router.query;

    const [page, setPage] = useState(null);
    const [accessLevel, setAccessLevel] = useState(null);

    useEffect(() => {
        if (id) {
            fetch(`/api/page/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setPage(data.page);
                        setAccessLevel(data.accessLevel);
                    }
                })
        }
    }, [id])

    return (
        <>
            <Head>
                <title>Notebook chat</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            {
                page && (
                    <Main middle={<Page page={page} initialContent={page.content} workbookId={null} accessLevel={accessLevel} />} showChatSinglePage={true} singlePage={page} pageId={page._id} key={page._id} />
                )
            }

        </>
    )
}

export default withAuth(PageRoute);