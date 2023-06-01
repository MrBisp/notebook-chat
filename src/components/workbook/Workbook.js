import React, { useEffect, useState } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import withAuth from '../../components/withAuth/WithAuth';
import WorkbookPages from '../../components/workbook-pages/Workbook-pages';
import Page from '../page/Page';

const Workbook = ({ workbookId, pageId = null }) => {
    const { workbooks } = useContext(AuthContext);

    const [workbook, setWorkbook] = useState(null);
    const [page, setPage] = useState(null);

    const [pageKey, setPageKey] = useState(0);

    useEffect(() => {
        if (workbooks) {
            const currentWorkbook = workbooks.find((workbook) => workbook._id === workbookId);
            setWorkbook(currentWorkbook);
            console.log("Current workbook: ", currentWorkbook);

            setPageKey(pageKey + 1);
        }
    }, [workbooks]);

    useEffect(() => {
        if (workbook && pageId) {
            const currentPage = workbook.pages.find((page) => page._id === pageId);
            setPage(currentPage);
            console.log("Current page: ", currentPage);
        }
    }, [workbook]);


    return (
        <main>
            <div className="main-container">
                <div className="main-container__left" id="main-container__left">
                    <WorkbookPages workbook={workbook} key={pageKey} />
                </div>
                <div className="main-container__right">
                    {
                        workbook && !pageId && (
                            <div>
                                {
                                    workbook &&
                                    <>
                                        <h1>{workbook.title}</h1>
                                        <p>{workbook._id}</p>
                                    </>
                                }
                                {
                                    !workbook && <p>No workbook found!</p>
                                }
                            </div>
                        )
                    }
                    {
                        workbook && page && (
                            <div className='workbook-container'>
                                <Page page={page} workbookId={workbook._id} initialContent={page.content} key={page._id} />
                            </div>
                        )
                    }
                </div>
            </div>
        </main>

    );
}

export default withAuth(Workbook);