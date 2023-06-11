import React, { useEffect, useState } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import withAuth from '../../components/withAuth/WithAuth';
import WorkbookPages from '../../components/workbook-pages/Workbook-pages';
import Page from '../page/Page';
import Link from 'next/link';
import { MdClose, MdChat, MdKeyboardDoubleArrowLeft } from 'react-icons/md';
import { useRouter } from 'next/router';
import ChatNotebook from '../../components/chat-notebook/Chat-notebook';
import MobileBottomNavbar from '../mobile-bottom-navbar/Mobile-Bottom-Navbar';

const Workbook = ({ workbookId, pageId = null }) => {
    const { workbooks, deleteWorkbook, updateWorkbook, addPage } = useContext(AuthContext);

    const [workbook, setWorkbook] = useState(null);
    const [page, setPage] = useState(null);

    const [pageKey, setPageKey] = useState(0);
    const [groupedPages, setGroupedPages] = useState(null);

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
            const grouped = groupPagesByDate(workbook.pages);
            setGroupedPages(grouped);

            setWorkbookTitle(workbook.title);
        }
    }, [workbook]);

    const getLastUpdatedString = (date) => {
        const dateObj = new Date(date);
        const f = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
        const diff = dateObj.getTime() - Date.now();

        //If the difference is less than 1 day, return the time
        if (diff < 86400000) {
            return 'today at ' + dateObj.toLocaleTimeString();
        }

        //If the difference is less than 1 week, return the day of the week
        if (diff < 604800000) {
            return dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        }

        //If the difference is less than 1 year, return the month and day
        if (diff < 31536000000) {
            return dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        }

        return 'a long time ago';
    }

    const groupPagesByDate = (pages) => {
        const groupedPages = {};

        pages.forEach((page) => {
            const currentDate = new Date();
            const lastUpdatedDate = new Date(page.lastEdited);
            const timeDiff = currentDate.getTime() - lastUpdatedDate.getTime();
            const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            let header;

            if (daysDiff === 0) {
                header = 'Today';
            } else if (daysDiff === 1) {
                header = 'Yesterday';
            } else if (daysDiff <= 7) {
                header = 'Past 7 days';
            } else if (daysDiff <= 30) {
                header = 'Past 30 days';
            } else {
                header = 'Older';
            }

            if (!groupedPages[header]) {
                groupedPages[header] = [page];
            } else {
                groupedPages[header].push(page);
            }
        });

        // Sort the pages within each date group based on lastEdited in descending order
        Object.keys(groupedPages).forEach((date) => {
            groupedPages[date].sort((a, b) => new Date(b.lastEdited) - new Date(a.lastEdited));
        });

        return groupedPages;
    };

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


    const setShowChatHandler = () => {
        //Save it in localstorage
        localStorage.setItem('showChat', !showChat);

        setShowChat(!showChat);
    }

    const setShowPagesHandler = () => {
        //Save it in localstorage
        localStorage.setItem('showPages', !showPages);

        setShowPages(!showPages);
    }

    useEffect(() => {
        //If on mobile, abort
        if (window.innerWidth < 768) return;

        //Check in localstorage if the user has set the showChat or showPages
        const showChatStorage = localStorage.getItem('showChat');
        const showPagesStorage = localStorage.getItem('showPages');

        if (showChatStorage !== null) {
            setShowChat(showChatStorage === 'true'); //Convert to boolean
        }

        if (showPagesStorage !== null) {
            setShowPages(showPagesStorage === 'true'); //Convert to boolean
        }
    }, [])


    return (
        <main>
            <div className="main-container">
                <div className={showPages ? 'main-container__left' : 'main-container__left hide'} id="main-container__left">
                    <MdKeyboardDoubleArrowLeft className={showPages ? 'close-icon point-left' : 'close-icon point-right'} onClick={() => { setShowPagesHandler() }} />
                    <WorkbookPages workbook={workbook} key={pageKey} />
                </div>
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
                                {groupedPages && (
                                    <div className="">
                                        {Object.keys(groupedPages).map((date) => (
                                            <div key={date} className="grouped-pages-group day-container">
                                                <h2>{date}</h2>
                                                {groupedPages[date].map((page) => (
                                                    <Link href={`/notebook/${workbook._id}/page/${page._id}`} key={page._id}>
                                                        <div key={page._id} className="card">
                                                            <div className='left'>
                                                                <h3>{page.title}</h3>
                                                                <p>Last updated {getLastUpdatedString(page.lastEdited)}</p>
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
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {
                                    groupedPages && Object.keys(groupedPages).length === 0 && (
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
                {
                    true && (
                        <div className={showChat ? 'main-container__chat' : 'main-container__chat hide'} id="chat-notebook">
                            <MdChat className="chat-icon" onClick={() => { setShowChatHandler(!showChat) }} />
                            <ChatNotebook currentPage={page} workbook={workbook} key={pageKey} />
                        </div>
                    )
                }
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
            <MobileBottomNavbar showPages={mobileShowPagesHandler} showChat={mobileShowChatHandler} showWrite={mobileShowWriteHandler} />
        </main>


    );
}

export default withAuth(Workbook);