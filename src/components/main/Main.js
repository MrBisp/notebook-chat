import { useState, useEffect, useContext } from "react"
import styles from './Main.module.css'
import LeftBar from '../../components/left-bar/Left-bar';
import { AuthContext } from '../../context/AuthContext';
import Link from "next/link";
import ChatNotebook from "../chat-notebook/Chat-notebook";
import Chat from "../chat/Chat";


import { MdClose, MdSearch, MdKeyboardDoubleArrowLeft } from 'react-icons/md';



const Main = ({ middle, modalContent = "", workbookId = null, pageId = null }) => {

    const [showLeft, setShowLeft] = useState(true);
    const [showRight, setShowRight] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    const [showSearch, setShowSearch] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const [showModal, setShowModal] = useState(false);

    const { workbooks, deleteWorkbook, updateWorkbook, addPage } = useContext(AuthContext);
    const [notebook, setNotebook] = useState(null);
    const [page, setPage] = useState(null);

    const toggleLeft = () => {
        setShowLeft(!showLeft);
        localStorage.setItem('showLeft', !showLeft); //Save in localstorage
    }
    const toggleRight = () => {
        setShowRight(!showRight);
        localStorage.setItem('showRight', !showRight); //Save in localstorage
    }

    //Get the workbooks from the context
    useEffect(() => {
        if (workbooks && workbookId) {
            const currentWorkbook = workbooks.find((workbook) => workbook._id === workbookId);
            setNotebook(currentWorkbook);
        }
    }, [workbooks])

    //Get the page from the context
    useEffect(() => {
        if (notebook && pageId) {
            const currentPage = notebook.pages.find((page) => page._id === pageId);
            setPage(currentPage);
        }
    }, [notebook])

    //Set the showLeft and showRight states from localstorage
    useEffect(() => {
        //If on mobile, abort
        if (window.innerWidth < 768) return;

        //Check in localstorage if the user has set the showChat or showPages
        const showRightStorage = localStorage.getItem('showRight');
        const showLeftStorage = localStorage.getItem('showLeft');

        if (showRightStorage !== null) {
            setShowRight(showRightStorage === 'true'); //Convert to boolean
        }

        if (showLeftStorage !== null) {
            setShowLeft(showLeftStorage === 'true'); //Convert to boolean
        }

        setIsLoading(false);
    }, [])

    //Press ESC to close search and modal
    useEffect(() => {
        const closeSearch = (e) => {
            if (e.keyCode === 27) {
                setShowSearch(false);
                setShowModal(false);
            }
        }
        window.addEventListener('keydown', closeSearch);
        return () => {
            window.removeEventListener('keydown', closeSearch);
        }
    }, [])

    //Search for notes
    useEffect(() => {
        if (searchValue === '') return;
        let results = []

        //Now let's see if it matches one of the notebook names
        let notebooks = workbooks.filter((workbook) => workbook.title.toLowerCase().includes(searchValue.toLowerCase()));
        if (notebooks.length > 0) {
            //We have a match, let's add it to the results
            notebooks = notebooks.map((notebook) => ({ ...notebook, type: 'Notebook' }));
            results = [...results, ...notebooks];
        }

        //Let's first see if it matches one of the page titles in any of the notebooks
        let pages = workbooks.reduce((acc, workbook) => {
            let pages = workbook.pages.filter((page) => page.title.toLowerCase().includes(searchValue.toLowerCase()));
            //Add the url to the page
            pages = pages.map((page) => ({ ...page, workbookId: workbook._id }));
            return [...acc, ...pages];
        }, []);
        if (pages.length > 0) {
            //We have a match, let's add it to the results
            pages = pages.map((page) => ({ ...page, type: 'Page' }));
            results = [...results, ...pages];
        }

        //Now let's see if it matches one of the page contents
        let pagesContent = workbooks.reduce((acc, workbook) => {
            let pages = workbook.pages.filter((page) => page.content.toLowerCase().includes(searchValue.toLowerCase()));
            //Add the url to the page
            pages = pages.map((page) => ({ ...page, workbookId: workbook._id }));
            return [...acc, ...pages];
        }, []);
        if (pagesContent.length > 0) {
            //We have a match, let's add it to the results
            pagesContent = pagesContent.map((page) => ({ ...page, type: 'Page' }));
            results = [...results, ...pagesContent];
        }

        setSearchResults(results);
    }, [searchValue])


    return (
        <>
            <div className={styles.main} style={{ filter: (showSearch || showModal) ? 'blur(3px)' : 'blur(0px)' }}>
                {isLoading && <div className={styles.loading}>Loading...</div>}
                {!isLoading &&
                    <>
                        <div className={styles.left} style={{ transform: showLeft ? 'translateX(0%)' : 'translateX(-150%)', width: showLeft ? '20%' : '0%' }}>
                            <span className={styles.toggleShow} onClick={toggleLeft}>
                                <MdKeyboardDoubleArrowLeft className={styles.arrowBtn} style={{ transform: showLeft ? 'rotate(0deg)' : 'rotate(180deg)' }} />
                            </span>
                            <div className={styles.content}>
                                <LeftBar searchFunction={() => setShowSearch(true)} notebook={notebook} />
                            </div>
                        </div>
                        <div className={styles.middle}>
                            {middle}
                        </div>
                        {
                            page && (
                                <div className={styles.right} style={{ transform: showRight ? 'translateX(0%)' : 'translateX(150%)', width: showRight ? '30%' : '0%' }}>
                                    <span className={styles.toggleShow} onClick={toggleRight}>
                                        <MdKeyboardDoubleArrowLeft className={styles.arrowBtn} style={{ transform: showRight ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                                    </span>
                                    <div className={styles.content}>
                                        <div className={'main-container__chat'} id="chat-notebook">
                                            <Chat currentPage={page} workbook={notebook} key={page._id} />
                                        </div>
                                    </div>
                                </div>
                            )
                        }

                    </>
                }
            </div>
            {
                showSearch &&
                <div className={styles.search} onClick={() => { setShowSearch(false) }}>
                    <div className={styles.searchModal} onClick={(e) => { e.stopPropagation() }}>
                        <MdClose className={styles.closeSearch} onClick={() => { setShowSearch(false) }} />
                        <div className={styles.searchInputContainer}>
                            <MdSearch className={styles.searchIcon} />
                            <input id="search-input" autoFocus autocomplete="one-time-code" type="text" placeholder="Search for notes..." value={searchValue} onChange={(e) => { setSearchValue(e.target.value) }} />
                        </div>
                        <div className={styles.searchResults}>
                            {
                                searchValue !== '' && searchResults.length > 0 &&
                                <>
                                    {
                                        searchResults.map((result, index) => (
                                            <Link key={index} className={styles.searchResult} onClick={() => { setShowSearch(false) }} href={result.type === 'Page' ? `/notebook/${result.workbookId}/page/${result._id}` : `/notebook/${result._id}`}>
                                                <span className={styles.searchResult__name}>{result.title}</span>
                                                <span className={styles.searchResult__type}>{result.type}</span>
                                            </Link>
                                        ))
                                    }
                                </>
                            }
                            {
                                searchValue !== '' && searchResults.length === 0 &&
                                <div className={styles.noResults}>No results found</div>
                            }
                            {
                                searchValue === '' &&
                                <div className={styles.noResults}>Start typing to search</div>
                            }
                        </div>
                    </div>
                </div>
            }
            {
                showModal &&
                <div className={styles.modal} onClick={() => { setShowModal(false) }}>
                    <div className={styles.modalContent} onClick={(e) => { e.stopPropagation() }}>
                        <MdClose className={styles.closeModal} onClick={() => { setShowModal(false) }} />
                        {modalContent}
                    </div>
                </div>
            }
        </>
    )
}

export default Main;