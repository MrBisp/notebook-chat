import React, { useEffect, useState } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import withAuth from '../../components/withAuth/WithAuth';
import WorkbookPages from '../../components/workbook-pages/Workbook-pages';
import Page from '../page/Page';
import Link from 'next/link';
import { MdClose, MdChat, MdKeyboardDoubleArrowLeft } from 'react-icons/md';
import { useRouter } from 'next/router';

const Workbook = ({ workbookId, pageId = null }) => {
    const { workbooks, deleteWorkbook, updateWorkbook, addPage } = useContext(AuthContext);

    const [workbook, setWorkbook] = useState(null);
    const [page, setPage] = useState(null);

    const [pageKey, setPageKey] = useState(0);
    const [pages, setPages] = useState(null);

    const [showSettings, setShowSettings] = useState(false);
    const [workbookTitle, setWorkbookTitle] = useState('');
    const [showCreatePage, setShowCreatePage] = useState(false);

    const [showChat, setShowChat] = useState(false);
    const [showPages, setShowPages] = useState(true);

    const router = useRouter();

    useEffect(() => {
        if (workbooks) {
            const currentWorkbook = workbooks.find((workbook) => workbook._id === workbookId);
            setWorkbook(currentWorkbook);
            setPageKey(pageKey + 1);
        }
    }, [workbooks]);

    useEffect(() => {
        if (workbook && pageId) {
            const currentPage = workbook.pages.find((page) => page._id === pageId);
            setPage(currentPage);
        }
    }, [workbook]);

    useEffect(() => {
        if (workbook) {
            setPages(workbook.pages);
        }
    }, [workbook]);

    const addPageHandler = async (e) => {
        console.log('Add page')
        e.preventDefault();
        let newPage = await addPage(workbookId);
        if (newPage) {
            router.push(`/notebook/${workbookId}/page/${newPage._id}`);
        }
    }

    const mobileShowPagesHandler = () => {
        const left = document.getElementById('main-container__left');
        const right = document.getElementById('main-container__right');
        const chatElement = document.getElementById('chat-notebook');

        left.classList.remove('hide');
        right.classList.add('hide');
        chatElement.classList.add('hide');

        setShowPages(true);
        setShowChat(false);
    }

    const mobileShowChatHandler = () => {
        const left = document.getElementById('main-container__left');
        const right = document.getElementById('main-container__right');
        const chatElement = document.getElementById('chat-notebook');

        left.classList.add('hide');
        right.classList.add('hide');
        chatElement.classList.remove('hide');

        setShowPages(false);
        setShowChat(true);
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
                                {
                                    !workbook && <p>No workbook found!</p>
                                }
                                {workbook && pages && pages.length > 0 && (
                                    <>
                                        {
                                            pages.map((page) =>
                                                <>
                                                    <Link href={`/notebook/${workbook._id}/page/${page._id}`} key={page._id}>
                                                        <div key={page._id} className="card">
                                                            <div className='left'>
                                                                <h3>{page.title}</h3>
                                                                <p>Last updated at {new Date(page.updatedAt).toLocaleString()}</p>
                                                            </div>
                                                            <div className='right'>
                                                                <span className='page-previews'>
                                                                    <div className='page-preview'>
                                                                        <div className='page-inner'>
                                                                            <div className='page-preview-title'>{page.title}</div>
                                                                            <div className='page-preview-content' dangerouslySetInnerHTML={{ __html: page.content }}></div>
                                                                        </div>
                                                                    </div>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </>
                                            )
                                        }
                                    </>
                                )}
                                {
                                    pages && Object.keys(pages).length === 0 && (
                                        <>
                                            <p>You don't have any pages in this workbook yet. Creating one takes less than 10 seconds.</p>
                                        </>
                                    )
                                }
                                <div className='card' onClick={(e) => addPageHandler(e)}>
                                    <div className='left'>
                                        <h3>Create page</h3>
                                        <p>Create a page and write something awesome!</p>
                                    </div>
                                    <div className='right'>
                                        <span className='create-new-workbook-symbol'>+</span>
                                    </div>
                                </div>
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