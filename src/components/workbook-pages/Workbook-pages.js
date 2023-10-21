import React, { use, useEffect, useState } from 'react';
import styles from './Workbook-page.module.css';
import axios from 'axios';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import withAuth from '../withAuth/WithAuth';
import { useRouter } from 'next/router';
import Link from 'next/link';

import { MdDeleteOutline, MdKeyboardBackspace, MdSettings, MdClose } from "react-icons/md";

const WorkbookPages = ({ workbook }) => {

    const { addPage } = useContext(AuthContext);

    //Take the workbook as a state
    const [workbookState, setWorkbookState] = useState(workbook);

    const router = useRouter();

    useEffect(() => {
        setWorkbookState(workbook);
    }, [workbook]);

    const addPageHandler = async (e) => {
        console.log('Add page')
        e.preventDefault();
        let newPage = await addPage(workbookState._id);
        if (newPage) {
            router.push(`/notebook/${workbookState._id}/page/${newPage._id}`);
        }
    }

    const navigateToPage = (e) => {
        console.log('Navigate to page')
        e.preventDefault();
        const pageId = e.currentTarget.getAttribute('data-id');

        router.push(`/notebook/${workbookState._id}/page/${pageId}`);
    }


    return (
        <>
            {workbook && (
                <div className={styles.conversations} id="conversationscontainer">
                    <div className={styles.topContainer}>
                        <div className='back-container' onClick={() => { router.push('/notebook') }}>
                            <MdKeyboardBackspace />
                            <span>All notebooks</span>
                        </div>

                        <Link href={`/notebook/${workbookState._id}`}>
                            <h3 className={styles.conversationHeader}>{workbook.title}</h3>
                        </Link>
                    </div>
                    <div className={styles.middleContainer}>
                        {workbook && workbook.pages.reverse().map((page, index) => (
                            <div key={index} className={styles.conversation} data-id={page._id} onClick={(e) => { navigateToPage(e) }}>
                                <span className={styles.conversation__name}>{page.title}</span>
                                <span className={styles.conversation_hover}>
                                    <MdSettings onClick={(e) => { }} />
                                    <MdDeleteOutline onClick={(e) => { }} />
                                </span>
                            </div>
                        ))}
                        <div className={styles.conversation_new_container} onClick={addPageHandler}>
                            <span className={styles.conversation_new}>+ New page</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default WorkbookPages;