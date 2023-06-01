import React, { use, useEffect, useState } from 'react';
import styles from './Workbook-page.module.css';
import axios from 'axios';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import withAuth from '../withAuth/WithAuth';
import { useRouter } from 'next/router';

import { MdDeleteOutline } from "react-icons/md";
import { MdSettings } from 'react-icons/md';
import { MdClose } from 'react-icons/md';

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
        addPage(workbookState._id);
    }

    const navigateToPage = (e) => {
        console.log('Navigate to page')
        e.preventDefault();
        const pageId = e.currentTarget.getAttribute('data-id');

        router.push(`/workbook/${workbookState._id}/page/${pageId}`);
    }


    return (
        <>
            <div className={styles.conversations} id="conversationscontainer">
                <div className={styles.topContainer}>
                    <h3 className={styles.conversationHeader}>Pages</h3>
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
        </>
    )
}

export default WorkbookPages;