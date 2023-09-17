import { useState, useEffect, useContext } from "react";
import styles from './Left-bar.module.css';
import Link from "next/link";
import { useRouter } from "next/router";
import { AuthContext } from "../../context/AuthContext";

import { MdDeleteOutline, MdKeyboardBackspace, MdAutoAwesome, MdClose, MdHome, MdSearch, MdOutlineStickyNote2 } from "react-icons/md";


const LeftBar = ({ searchFunction, notebook = null }) => {

    const router = useRouter();

    const { workbooks, deleteWorkbook, updateWorkbook, addPage, logout } = useContext(AuthContext);

    const addPageHandler = async (e) => {
        e.preventDefault();
        let newPage = await addPage(notebook._id);
        if (newPage) {
            router.push(`/notebook/${notebook._id}/page/${newPage._id}`);
        }
    }

    return (
        <div className={styles.leftbar}>
            <div className={styles.topContainer}>
                <div className={styles.iconContainer} onClick={() => { router.push('/notebook') }}>
                    <MdHome />
                    <span>Notebooks</span>
                </div>
                <div className={styles.iconContainer} onClick={() => { router.push('/chat') }}>
                    <MdAutoAwesome />
                    <span>Chat</span>
                </div>
                <div className={styles.iconContainer} onClick={() => { searchFunction() }}>
                    <MdSearch />
                    <span>Search</span>
                </div>
            </div>
            <div className={styles.middleContainer}>
                {
                    notebook && (
                        <>
                            <Link href={`/notebook/${notebook._id}`}>
                                <h3 className={styles.title}>{notebook.title}</h3>
                            </Link>
                            {
                                notebook.pages.map((page, index) => (
                                    <Link className={styles.link} href={`/notebook/${notebook._id}/page/${page._id}`} key={index}>
                                        <div className={styles.page}>
                                            <MdOutlineStickyNote2 />
                                            <span className={styles.page__name}>{page.title}</span>
                                        </div>
                                    </Link>
                                ))
                            }
                            <div className={styles.addNewContainer} onClick={addPageHandler}>
                                <span className={styles.addNew}>+ New page</span>
                            </div>
                        </>
                    )
                }
            </div>
            <div className={styles.bottomContainer}>
                <div className={styles.iconContainer} onClick={logout}>
                    <MdClose />
                    <span>Logout</span>
                </div>
            </div>
        </div>
    )
}

export default LeftBar;