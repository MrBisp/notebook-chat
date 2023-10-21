import Head from 'next/head'
import { useState, useEffect } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import withAuth from '../../components/withAuth/WithAuth';
import { useRouter } from 'next/router';
import { MdClose, MdChat, MdKeyboardDoubleArrowLeft } from 'react-icons/md';
import Main from '@/components/main/Main';


const WorkbookPage = () => {
    const { workbooks, addWorkbook, pagesSharedWithUser } = useContext(AuthContext);

    const router = useRouter();

    const [workbookTitle, setWorkbookTitle] = useState('');
    const [showAddWorkbook, setShowAddWorkbook] = useState(false);
    const [sortedWorkbooks, setSortedWorkbooks] = useState([]);

    const [showPages, setShowPages] = useState(true);

    const addWorkbookHandler = async () => {
        const res = await addWorkbook(workbookTitle);
        if (res) {
            router.push(`/notebook/${res._id}`);
        }
    }

    const content = (
        <>
            <Head>
                <title>Notebook chat</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon-192.png" />
            </Head>
            <main>
                <div className="main-container">
                    <div className='workbooks'>
                        <div className='workbooks-header'>
                            <h1>Your notebooks</h1>
                            <span className='add-new-workbook-button' onClick={() => setShowAddWorkbook(true)}>+ Add new</span>
                        </div>
                        {
                            workbooks.length > 0 && (
                                <>
                                    <div className='workbooks-list'>
                                        {
                                            workbooks.map((workbook, index) => (
                                                <div className='card' key={index} onClick={() => { router.push(`/notebook/${workbook._id}`) }}>
                                                    <div className='left'>
                                                        <h3>{workbook.title}</h3>
                                                        <p>Last updated: {new Date(workbook.lastEdited).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className='right'>
                                                        <span className='page-previews'>
                                                            {
                                                                workbook.pages.slice(0, 3).map((page, index) => (
                                                                    <span key={index} className='page-preview'>
                                                                        <span className='page-preview-title'>{page.title}</span>
                                                                        <div className='page-preview-content' dangerouslySetInnerHTML={{ __html: page.content }}></div>
                                                                    </span>
                                                                ))
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </>
                            )
                        }
                        {
                            workbooks.length == 0 && (
                                <>
                                    <p>You don't have any notebooks yet. Creating one takes less than 10 seconds.</p>
                                    <div className='card' onClick={() => setShowAddWorkbook(true)}>
                                        <div className='left'>
                                            <h3>Create notebook</h3>
                                            <p>Notebooks are a collection of pages. You can create as many notebooks as you want.</p>
                                        </div>
                                        <div className='right'>
                                            <span className='create-new-workbook-symbol'>+</span>
                                        </div>
                                    </div>
                                </>
                            )
                        }
                        {
                            pagesSharedWithUser.length > 0 && (
                                <div className='card' onClick={() => { router.push(`/notebook/shared`) }}>
                                    <div className='left'>
                                        <h3>Shared with you</h3>
                                        <p>You have access to {pagesSharedWithUser.length} pages that others have shared with you.</p>
                                    </div>
                                    <div className='right'>
                                        <span className='page-previews'>
                                            {
                                                pagesSharedWithUser.slice(0, 3).map((page, index) => (
                                                    <span key={index} className='page-preview'>
                                                        <span className='page-preview-title'>{page.title}</span>
                                                        <div className='page-preview-content' dangerouslySetInnerHTML={{ __html: page.content }}></div>
                                                    </span>
                                                ))
                                            }
                                        </span>
                                    </div>
                                </div>
                            )
                        }
                    </div>
                </div >
            </main >
            {
                showAddWorkbook && (
                    <>
                        <div className="modal-overlay">
                            <div className='modal'>
                                <div className='modal-header'>
                                    <span className='modal-title'>Create notebook</span>
                                    <div className='modal-x' onClick={() => { setShowAddWorkbook(false); }}><MdClose /></div>
                                </div>
                                <div className='modal-content'>
                                    <div className='modal-option'>
                                        <span className='modal-option-label'>Title</span>
                                        <input className='modal-option-input' placeholder={"Example: 'School', 'Work', 'Business ideas'"} value={workbookTitle} onChange={(e) => setWorkbookTitle(e.target.value)}></input>
                                    </div>
                                </div>
                                <div className='modal-footer'>
                                    <button className='modal-button-cancel' onClick={() => { setShowAddWorkbook(false); }}>Cancel</button>
                                    <button className='modal-button' onClick={addWorkbookHandler}>Create notebook</button>
                                </div>

                            </div>
                        </div>
                    </>
                )
            }
        </>
    )

    return (
        <Main middle={content} />
    )
}

export default withAuth(WorkbookPage);