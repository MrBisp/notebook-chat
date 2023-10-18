import React, { useEffect, useState } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import withAuth from '../../components/withAuth/WithAuth';
import Page from '../page/Page';
import Link from 'next/link';
import { MdClose, MdChat, MdKeyboardDoubleArrowLeft, MdMoreVert } from 'react-icons/md';
import WorkbookPages from '../workbook-pages/WorkbookPages';
import { useRouter } from 'next/router';
import { set } from 'mongoose';

const Workbook = ({ workbookId, pageId = null }) => {
    const { workbooks, deleteWorkbook, updateWorkbook, addPage, deletePage, track, user, authToken } = useContext(AuthContext);

    const [workbook, setWorkbook] = useState(null);
    const [page, setPage] = useState(null);

    const [pages, setPages] = useState(null);

    const [showSettings, setShowSettings] = useState(false);
    const [workbookTitle, setWorkbookTitle] = useState('');
    const [showCreatePage, setShowCreatePage] = useState(false);

    const [showChat, setShowChat] = useState(false);
    const [showPages, setShowPages] = useState(true);

    const [accessLevel, setAccessLevel] = useState(null);

    const router = useRouter();

    useEffect(() => {
        if (workbooks) {
            const currentWorkbook = workbooks.find((workbook) => workbook._id === workbookId);
            if (!currentWorkbook) {
                router.push('/notebook/');
                return;
            }
            setWorkbook(currentWorkbook);
            setWorkbookTitle(currentWorkbook.title);
            setPages(currentWorkbook.pages);
        }
    }, [workbooks]);

    useEffect(() => {
        if (workbook && pageId) {
            const currentPage = workbook.pages.find((page) => page._id === pageId);
            setPage(currentPage);
        }
    }, [workbook]);

    const addPageHandler = async (e) => {
        console.log('Add page')
        e.preventDefault();
        let newPage = await addPage(workbookId);
        if (newPage) {
            track('Page created', { page: newPage?.title, notebook: workbook?.title, from: 'Notebook' });
            router.push(`/notebook/${workbookId}/page/${newPage._id}`);
        }
    }

    const mobileShowWriteHandler = () => {
        const left = document.getElementById('main-container__left');
        const right = document.getElementById('main-container__right');
        const chatElement = document.getElementById('chat-notebook');

        left.classList.add('hide');
        right.classList.remove('hide');
        chatElement.classList.add('hide');

        setShowPages(false);
        setShowChat(false);
    }

    useEffect(() => {
        if (document.getElementById('main-container__left') && document.getElementById('main-container__right') && document.getElementById('chat-notebook')) {
            if (window.innerWidth > 768) return;
            mobileShowWriteHandler();
        }
    }, [workbooks])

    useEffect(() => {
        if (!pageId || !user) return;

        //Get access level
        const url = `/api/userpageaccess?pageId=${pageId}`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
        fetch(url, {
            method: 'GET',
            headers: headers
        }).then((res) => {
            console.log(res);
            if (res.status === 200) {
                return res.json();
            } else {
                throw new Error('Something went wrong');
            }
        }).then((data) => {
            setAccessLevel(data.data.accessLevel);
        }).catch((err) => {
            console.log(err);
        })
    }, [pageId])


    return (
        <main>
            <div className="main-container">
                <div className="main-container__right" id="main-container__right">
                    {
                        workbook && !pageId && (
                            <div className='show-all-pages'>
                                {
                                    workbook &&
                                    <>
                                        <div className='all-pages-header'>
                                            <h1>{workbook.title}</h1>
                                            <span className='settings' onClick={() => { setShowSettings(true) }}>Settings</span>
                                        </div>

                                    </>
                                }
                                {workbook && pages && pages.length > 0 && (
                                    <WorkbookPages pages={pages} workbook={workbook} />
                                )}
                                {
                                    pages && Object.keys(pages).length === 0 && (
                                        <>
                                            <p className='workbook-no-pages'>You don't have any pages in this notebook yet. Creating one takes less than 2 seconds.</p>
                                        </>
                                    )
                                }
                                <div className='notebook-page-link create-page' key={'create'} onClick={(e) => addPageHandler(e)}>
                                    <h3>+ Create page</h3>
                                </div>
                            </div>
                        )
                    }
                    {
                        workbook && page && accessLevel && (
                            <div className='workbook-container'>
                                <Page page={page} workbookId={workbook._id} initialContent={page.content} key={page._id} accessLevel={accessLevel} />
                            </div>
                        )
                    }
                    {
                        workbook && page && !accessLevel && (
                            <p>Loading...</p>
                        )
                    }
                </div>
            </div>
            {
                showSettings && (
                    <div className="modal-overlay">
                        <div className='modal'>
                            <div className='modal-header'>
                                <span className='modal-title'>Workbook settings</span>
                                <div className='modal-x' onClick={() => { setShowSettings(false); }}><MdClose /></div>
                            </div>
                            <div className='modal-content'>
                                <div className='modal-option'>
                                    <span className='modal-option-label'>Name of workbook</span>
                                    <input className='modal-option-input' value={workbookTitle} onChange={(e) => setWorkbookTitle(e.target.value)}></input>
                                </div>
                                <div className='modal-option'>
                                    <span className='modal-option-label'>Delete workbook</span>
                                    <button className='modal-option-delete-button' onClick={() => {
                                        if (confirm('Are you sure, you want to delete this workbook?')) {
                                            deleteWorkbook(workbook._id);
                                            setShowSettings(false);
                                            //Redirect to home
                                            router.push('/notebook/');
                                        }
                                    }}>Delete</button>
                                </div>
                            </div>
                            <div className='modal-footer'>
                                <button className='modal-button-cancel' onClick={() => { setShowSettings(false); }}>Cancel</button>
                                <button className='modal-button' onClick={() => {
                                    setShowSettings(false);
                                    updateWorkbook(workbook._id, { title: workbookTitle });
                                }} >Update</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </main>
    );
}

export default withAuth(Workbook);