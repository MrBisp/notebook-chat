import Head from 'next/head'
import Workbook from '@/components/workbook/Workbook';
import { useState, useEffect } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import withAuth from '../../components/withAuth/WithAuth';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { MdClose } from 'react-icons/md';

const WorkbookPage = () => {
    const { workbooks, addWorkbook } = useContext(AuthContext);

    const router = useRouter();

    const [workbookTitle, setWorkbookTitle] = useState('');
    const [showAddWorkbook, setShowAddWorkbook] = useState(false);
    const [sortedWorkbooks, setSortedWorkbooks] = useState([]);

    const addWorkbookHandler = async () => {
        const res = await addWorkbook(workbookTitle);
        if (res) {
            router.push(`/notebook/${res._id}`);
        }
    }

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

    const getHeaderString = (lastUpdated) => {
        const currentDate = new Date();
        const lastUpdatedDate = new Date(lastUpdated);
        const timeDiff = currentDate.getTime() - lastUpdatedDate.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

        if (daysDiff === 0) {
            return 'Today';
        } else if (daysDiff === 1) {
            return 'Yesterday';
        } else if (daysDiff <= 7) {
            return 'Past 7 days';
        } else if (daysDiff <= 30) {
            return 'Past 30 days';
        } else {
            return 'Older';
        }
    };

    useEffect(() => {
        // Sort the workbooks by lastEdited in descending order
        const sorted = workbooks.sort((a, b) => b.lastEdited - a.lastEdited);
        setSortedWorkbooks(sorted);
    }, [workbooks]);

    const groupWorkbooksByDate = (workbooks) => {
        const groupedWorkbooks = {};

        workbooks.forEach((workbook) => {
            const header = getHeaderString(workbook.lastEdited);

            if (!groupedWorkbooks[header]) {
                groupedWorkbooks[header] = [workbook];
            }

            // Check if the workbook is already present in the array
            const isDuplicate = groupedWorkbooks[header].some((w) => w._id === workbook._id);

            if (!isDuplicate) {
                // Insert the workbook at the beginning of the array for its corresponding header
                groupedWorkbooks[header].unshift(workbook);
            }
        });

        return groupedWorkbooks;
    };

    const renderGroupedWorkbooks = (groupedWorkbooks) => {
        const dates = Object.keys(groupedWorkbooks);

        return dates.map((date) => {
            const workbooks = groupedWorkbooks[date];

            return (
                <div key={date} className='day-container'>
                    <h2>{date}</h2>
                    {workbooks.map((workbook) => {
                        const lastUpdatedString = getLastUpdatedString(workbook.lastEdited);

                        return (
                            <Link key={workbook._id} href={`/notebook/${workbook._id}`}>
                                <div className='card'>
                                    <div className='left'>
                                        <h3>{workbook.title}</h3>
                                        <p>Last updated {lastUpdatedString}</p>
                                    </div>
                                    <div className='right'>
                                        <span className='page-previews'>
                                            {
                                                workbook.pages && workbook.pages
                                                    .slice() // Create a copy of the array
                                                    .sort((a, b) => new Date(b.lastEdited) - new Date(a.lastEdited)) // Sort the array by lastEdited in descending order
                                                    .slice(0, 3) // Get the first three pages after sorting
                                                    .reverse() // Reverse the order of the three pages
                                                    .map((page, index) => (
                                                        <div className='page-preview'>
                                                            <div className='page-inner'>
                                                                <div className='page-preview-title'>{page.title}</div>
                                                                <div className='page-preview-content' dangerouslySetInnerHTML={{ __html: page.content }}></div>
                                                            </div>
                                                        </div>
                                                    ))
                                            }
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            );
        });
    }

    // Group workbooks by date
    const groupedWorkbooks = groupWorkbooksByDate(sortedWorkbooks);

    return (
        <>

            <Head>
                <title>Chat and notebook</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main>
                <div className="main-container">
                    <div className='workbooks'>
                        <div className='workbooks-header'>
                            <h1>Your notebooks</h1>
                            <span className='add-new-workbook-button' onClick={() => setShowAddWorkbook(true)}>+ Add new</span>
                        </div>


                        {renderGroupedWorkbooks(groupedWorkbooks)}
                        {
                            workbooks.length == 0 && (
                                <>
                                    <p>You don't have any workbooks yet. Creating one takes less than 10 seconds.</p>
                                    <div className='card' onClick={() => setShowAddWorkbook(true)}>
                                        <div className='left'>
                                            <h3>Create workbook</h3>
                                            <p>Workbooks are a collection of pages. You can create as many workbooks as you want.</p>
                                        </div>
                                        <div className='right'>
                                            <span className='create-new-workbook-symbol'>+</span>
                                        </div>
                                    </div>
                                </>
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
                                    <span className='modal-title'>Create workbook</span>
                                    <div className='modal-x' onClick={() => { setShowAddWorkbook(false); }}><MdClose /></div>
                                </div>
                                <div className='modal-content'>
                                    <div className='modal-option'>
                                        <span className='modal-option-label'>Title</span>
                                        <input className='modal-option-input' value={workbookTitle} onChange={(e) => setWorkbookTitle(e.target.value)}></input>
                                    </div>
                                </div>
                                <div className='modal-footer'>
                                    <button className='modal-button-cancel' onClick={() => { setShowAddWorkbook(false); }}>Cancel</button>
                                    <button className='modal-button' onClick={addWorkbookHandler}>Create workbook</button>
                                </div>

                            </div>
                        </div>
                    </>
                )
            }
        </>
    )
}

export default withAuth(WorkbookPage);