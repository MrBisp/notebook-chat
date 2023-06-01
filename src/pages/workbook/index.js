import Head from 'next/head'
import Workbook from '@/components/workbook/Workbook';
import { useState, useEffect } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import withAuth from '../../components/withAuth/WithAuth';
import { useRouter } from 'next/router';
import Link from 'next/link';

const WorkbookPage = () => {
    const { workbooks, addWorkbook } = useContext(AuthContext);

    const router = useRouter();

    const [workbookTitle, setWorkbookTitle] = useState('');

    const addWorkbookHandler = async () => {
        const res = await addWorkbook(workbookTitle);
        if (res) {
            router.push(`/workbook/${res._id}`);
        }
    }

    return (
        <>

            <Head>
                <title>Chat and notebook</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main>
                <div className="main-container">
                    <div>
                        {
                            workbooks && workbooks.map((workbook) => {
                                return (
                                    <div className="workbook" key={workbook._id}>
                                        <Link href={`/workbook/${workbook._id}`}>
                                            <p>{workbook.title} ({workbook._id})</p>
                                        </Link>
                                    </div>
                                )
                            })
                        }
                    </div>
                    {
                        !workbooks && <p>No workbooks found!</p>
                    }
                    <br />
                    <input type="text" placeholder="Enter workbook title" onChange={(e) => setWorkbookTitle(e.target.value)} />
                    <button onClick={addWorkbookHandler}>Add notebook</button>
                </div>
            </main>
        </>
    )
}

export default withAuth(WorkbookPage);