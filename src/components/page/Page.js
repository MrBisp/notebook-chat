import React, { useState, useMemo, useRef, useEffect, useContext } from 'react'
import 'react-quill/dist/quill.snow.css';
import { AuthContext } from '../../context/AuthContext';
import Tiptap from '../tiptap/TipTap';
import EditorMenu from '../editor-menu/Editor-menu';
import { MdChevronRight } from 'react-icons/md';
import Link from 'next/link';

const Page = ({ page, initialContent, workbookId = null, accessLevel = null }) => {
    const { updatePage, authToken, user, track, workbooks } = useContext(AuthContext);
    const [content, setContent] = useState(initialContent);
    const [pageTitle, setPageTitle] = useState(page.title);
    const [editingTitle, setEditingTitle] = useState(false);
    const [editor, setEditor] = useState(null);
    const [showSimilarPages, setShowSimilarPages] = useState(localStorage.getItem('showSimilarPages') === 'true');
    const [similarPages, setSimilarPages] = useState([]);

    const timeSinceLastChange = useRef(0);
    const changeSinceLastSave = useRef(false);
    const contentRef = useRef(content);
    const pageTitleRef = useRef(pageTitle);
    const lastChange = useRef(new Date().getTime());

    const TIMETOSAVE = 1000;

    const handleContentChange = (content) => {
        setContent(content);

        changeSinceLastSave.current = true;
        lastChange.current = new Date().getTime();
        contentRef.current = content;
    }

    const savePage = async () => {
        let update = {
            title: pageTitleRef.current,
            content: contentRef.current,
            subPages: page.subPages
        }
        updatePage(page._id, update, workbookId)
        updatePinecone();
        track('Page saved', { page: page.title, notebook: workbookId ? workbookId : '[No notebook]' })
    }

    const getSimilarPages = (pages) => {
        //In workbooks, find the pages by id (pages[0].id)
        //Then, get the titles of those pages
        let similarPages = [];

        pages.forEach(page => {
            workbooks.forEach(workbook => {
                workbook.pages.forEach(workbookPage => {
                    if (workbookPage._id === page.id) {
                        similarPages.push({
                            id: page.id,
                            title: workbookPage.title,
                        });
                    }
                });
            });
        });
        console.log(similarPages)
        setSimilarPages(similarPages);
    }

    const updatePinecone = async () => {
        let url = '/api/pinecone/insert'
        let headers = {
            'Content-Type': 'application/json',
            'authorization': `Bearer ${authToken}`
        }
        let body = {
            pageId: page._id,
            content: contentRef.current
        }
        let response = await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(body) });
        let data = await response.json();
        getSimilarPages(data.similar);

        const order = await fetch('/api/order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                tokens: -1,
                type: 'pinecone',
                userid: user._id
            })
        })
    }

    //Save the page every 1 seconds (Autosave)
    useEffect(() => {
        const interval = setInterval(() => {
            timeSinceLastChange.current = new Date().getTime() - lastChange.current;
            if (timeSinceLastChange.current > TIMETOSAVE && changeSinceLastSave.current) {
                savePage();
                changeSinceLastSave.current = false;
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleTitleChange = (e) => {
        setPageTitle(e.target.value);
        pageTitleRef.current = e.target.value;

        let update = {
            title: e.target.value
        }
        updatePage(page._id, update, workbookId)
    }

    const handleTitleBlur = () => {
        setEditingTitle(false);
        savePage();
    }

    //Scroll content to top on load
    useEffect(() => {
        let element = document.querySelector('.editor')
        if (element) {
            element.scrollTop = 0;
        }
    }, []);

    const setEditorFromRef = (editor) => {
        setEditor(editor);
    }


    return (
        <div className='page'>
            <EditorMenu editor={editor} accessLevel={accessLevel} page={page} />
            <input
                type="text"
                value={pageTitle}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                className='page_title_input'
            />
            <Tiptap saveHandler={handleContentChange} value={content} key={page._id} setEditor={setEditorFromRef} pageId={page._id} />
            <div className='similar-pages'>
                <div className='similar-pages-header'>
                    <div className='similar-pages-header-title'
                        onClick={() => {
                            setShowSimilarPages(!showSimilarPages);
                            localStorage.setItem('showSimilarPages', !showSimilarPages);
                        }}
                    ><MdChevronRight style={{ transform: showSimilarPages ? 'rotate(90deg)' : 'rotate(0deg)' }} /></div>
                    {showSimilarPages && (<div className='similar-pages-header-text'>Related notes</div>)}
                </div>
                {
                    showSimilarPages && (
                        <div className='similar-pages-list'>
                            {
                                similarPages.map((page, index) => (
                                    <Link href={`/page/${page.id}`} key={index}>
                                        <div className='similar-pages-list-item'>
                                            {page.title}
                                        </div>
                                    </Link>
                                ))
                            }
                        </div>
                    )
                }

            </div>
        </div>
    )
}

export default Page