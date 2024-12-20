import { useState, useEffect, useContext, useRef } from "react"
import styles from './Main.module.css'
import LeftBar from '../../components/left-bar/Left-bar';
import { AuthContext } from '../../context/AuthContext';
import Link from "next/link";
import Chat from "../chat/Chat";
import { MdHome, MdOutlineAssignment, MdMenuBook, MdChat, MdEditNote, MdLogout } from 'react-icons/md';
import { MdClose, MdSearch, MdKeyboardDoubleArrowLeft } from 'react-icons/md';
import { useRouter } from "next/router";
import poppins from "../../../utils/font";

const Main = ({ middle, workbookId = null, pageId = null, showChatSinglePage = false, singlePage }) => {

    const { authToken, logout, modalContent, setModalContent, showCommmands, setShowCommands, commands, commandTitle } = useContext(AuthContext);

    const router = useRouter();

    const [showLeft, setShowLeft] = useState(true);
    const [showRight, setShowRight] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    const [showSearch, setShowSearch] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const [searchResultsPinecone, setSearchResultsPinecone] = useState([]);
    const TIMETOSAVE = 500;
    const timeSinceLastChange = useRef(0);
    const changeSinceLastSave = useRef(false);
    const lastChange = useRef(new Date().getTime());

    const [showModal, setShowModal] = useState(false);

    const { workbooks, deleteWorkbook, updateWorkbook, addPage } = useContext(AuthContext);
    const [notebook, setNotebook] = useState(null);
    const [page, setPage] = useState(null);

    const [isMobile, setIsMobile] = useState(false);
    const [showMobileChat, setShowMobileChat] = useState(false);

    const [focusedCommandIndex, setFocusedCommandIndex] = useState(null);

    //Keyboard shortcuts
    useEffect(() => {
        if (!window) return;

        const handleKeyDown = (event) => {
            if (showCommmands) {
                if (event.key === 'ArrowUp') {
                    setFocusedCommandIndex(prevIndex => (prevIndex > 0 ? prevIndex - 1 : commands.length - 1));
                    event.preventDefault();
                } else if (event.key === 'ArrowDown') {
                    setFocusedCommandIndex(prevIndex => (prevIndex < commands.length - 1 ? prevIndex + 1 : 0));
                    event.preventDefault();
                } else if (event.key === 'Enter' && focusedCommandIndex !== null) {
                    executeCommand(commands[focusedCommandIndex]);
                    event.preventDefault();
                }

                console.log("Current focused command", focusedCommandIndex)

                const key = event.key;
                const command = commands.find((c) => c.shortCut === key);

                if (command) {
                    event.preventDefault();  // Still preventing any default behavior for this key, if any
                    executeCommand(command);
                }
            }
        };
        if (!commands || commands.length === 0) {
            window.removeEventListener('keydown', handleKeyDown);
            return;
        }

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [showCommmands, commands, focusedCommandIndex]); //focusedCommandIndex makes sure that the correct command is executed when pressing enter

    const executeCommand = (command) => {
        if (command) {
            console.log("Running command", command)
            command.f();
            setShowCommands(false);
        }
    }

    //Scroll down
    useEffect(() => {
        if (focusedCommandIndex === null) return;
        const element = document.querySelector(`.${styles.command}.${styles.focused}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        }
    }, [focusedCommandIndex])


    useEffect(() => {
        if (window.innerWidth < 768) {
            setIsMobile(true);
        } else {
            setIsMobile(false);
        }
    }, [])

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

    useEffect(() => {
        if (!showChatSinglePage) return;

        if (singlePage) {
            setPage(singlePage);
        }
    }, [showChatSinglePage, singlePage])


    //Set the showLeft and showRight states from localstorage
    useEffect(() => {
        //If on mobile, abort
        //if (window.innerWidth < 768) return;

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
                setShowCommands(false);
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
        let results = [];
        setSearchResultsPinecone([]);

        changeSinceLastSave.current = true;
        lastChange.current = new Date().getTime();

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

    useEffect(() => {
        const interval = setInterval(() => {
            timeSinceLastChange.current = new Date().getTime() - lastChange.current;
            if (timeSinceLastChange.current > TIMETOSAVE && changeSinceLastSave.current) {
                pineconeSearch();
                changeSinceLastSave.current = false;
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const pineconeSearch = async () => {
        if (!searchValue) return;
        if (searchValue.trim() === '') return;

        const url = "/api/pinecone/notes";
        const headers = {
            'Content-Type': 'application/json',
            'authorization': `Bearer ${authToken}`
        }
        const body = {
            content: searchValue
        }
        const response = await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(body) });
        const data = await response.json();
        const results = data.results;

        //Now let's see if it matches one of the page id's
        let pages = workbooks.reduce((acc, workbook) => {
            let pages = workbook.pages.filter((page) => {
                let isMatch = false;
                results.forEach((result) => {
                    if (result.id === page._id.toString()) {
                        isMatch = true;
                    }
                })
                return isMatch;
            });
            //Add the url to the page
            pages = pages.map((page) => ({ ...page, workbookId: workbook._id }));
            return [...acc, ...pages];
        }, []);
        setSearchResultsPinecone(pages);
    }

    useEffect(() => {
        if (modalContent) {
            setShowModal(true);
        }
        if (!modalContent && showModal) {
            setShowModal(false);
        }
    }, [modalContent])

    useEffect(() => {
        //Remove modal content when modal is closed
        if (!showModal) {
            setModalContent(null);
        }
    }, [showModal])



    return (
        <>
            <div className={styles.main + " " + poppins.className} style={{ filter: (showSearch || showModal) ? 'blur(3px)' : 'blur(0px)' }}>
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
                                            <Chat currentPage={page} workbook={notebook ? notebook : null} key={page._id} />
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
                            <input id="search-input" autoFocus autoComplete="one-time-code" type="text" placeholder="Search for notes..." value={searchValue} onChange={(e) => { setSearchValue(e.target.value) }} />
                        </div>
                        <div className={styles.searchResults}>
                            {
                                searchValue !== '' && searchResults.length > 0 &&
                                <>
                                    {
                                        searchResults.slice(0, 5).map((result, index) => (
                                            <Link key={index} className={styles.searchResult} onClick={() => { setShowSearch(false) }} href={result.type === 'Page' ? `/notebook/${result.workbookId}/page/${result._id}` : `/notebook/${result._id}`}>
                                                <span className={styles.searchResult__name}>{result.title}</span>
                                                <span className={styles.searchResult__type}>{result.type}</span>
                                            </Link>
                                        ))
                                    }
                                </>
                            }
                            {
                                searchValue !== '' && searchResultsPinecone.length > 0 &&
                                <>
                                    {
                                        searchResultsPinecone.map((result, index) => (
                                            <Link key={index} className={styles.searchResult} onClick={() => { setShowSearch(false) }} href={`/notebook/${result.workbookId}/page/${result._id}`}>
                                                <span className={styles.searchResult__name}>{result.title}</span>
                                                <span className={styles.searchResult__type}>Page</span>
                                            </Link>
                                        ))
                                    }
                                </>
                            }
                            {
                                searchValue !== '' && searchResults.length === 0 && searchResultsPinecone.length === 0 &&
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
                        {modalContent}
                    </div>
                </div>
            }
            {
                showMobileChat && (
                    <div className={styles.mobileChat}>
                        <Chat currentPage={page} workbook={notebook} key={page._id} />
                    </div>
                )
            }
            {
                showCommmands && (
                    <div className={styles.commandsBg} onClick={() => { setShowCommands(false); }}>
                        <div className={styles.commandsContent} onClick={(e) => { e.stopPropagation() }}>
                            <div className={styles.commandsTitle}>{commandTitle}</div>
                            <div className={styles.commands}>
                                {
                                    commands.map((command, index) => (
                                        <div key={index}
                                            className={`${styles.command} ${index === focusedCommandIndex ? styles.focused : ''}`}
                                            onClick={() => executeCommand(command)}
                                            onMouseEnter={() => setFocusedCommandIndex(index)}
                                        >
                                            <div className={styles.command__title}>{command.title}</div>
                                            <div className={styles.command__shortcut}>{command.shortCut}</div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                )
            }
            {
                isMobile && (
                    <div className={styles.mobileMenu}>
                        <div className={styles.MobileBottomNavbar__item} onClick={() => {
                            router.push('/notebook');
                        }}>
                            <div className={styles.MobileBottomNavbar__item__icon}>
                                <MdHome />
                            </div>
                        </div>
                        <div className={styles.MobileBottomNavbar__item} onClick={() => {
                            router.push('/chat');
                        }}>
                            <div className={styles.MobileBottomNavbar__item__icon}>
                                <MdChat />
                            </div>
                        </div>
                        <div className={styles.MobileBottomNavbar__item} onClick={() => {
                            setShowSearch(!showSearch);
                        }}>
                            <div className={styles.MobileBottomNavbar__item__icon}>
                                <MdSearch />
                            </div>
                        </div>
                        {
                            page && (
                                <div className={styles.MobileBottomNavbar__item} onClick={() => {
                                    setShowMobileChat(!showMobileChat);
                                }}>
                                    <div className={styles.MobileBottomNavbar__item__icon}>
                                        <MdChat />
                                    </div>
                                </div>
                            )
                        }
                        {
                            !page && (
                                <div className={styles.MobileBottomNavbar__item} onClick={() => {
                                    localStorage.removeItem('notebook-chat');
                                    localStorage.removeItem('suggested-messages');
                                    localStorage.removeItem('first-message');
                                    logout();
                                }}>
                                    <div className={styles.MobileBottomNavbar__item__icon}>
                                        <MdLogout />
                                    </div>
                                </div>
                            )
                        }
                    </div>
                )
            }
        </>
    )
}

export default Main;