import React, { useState, useMemo, useRef, useEffect, useContext } from 'react'
import 'react-quill/dist/quill.snow.css';
import dynamic from "next/dynamic";
import { AuthContext } from '../../context/AuthContext';
import Tiptap from '../tiptap/TipTap';

const Page = ({ page, initialContent, workbookId }) => {
    const { updatePage } = useContext(AuthContext);
    const [content, setContent] = useState(initialContent);
    const [pageTitle, setPageTitle] = useState(page.title);
    const [editingTitle, setEditingTitle] = useState(false);
    const ReactQuill = useMemo(() => dynamic(() => import('react-quill'), { ssr: false }), []);

    const timeSinceLastChange = useRef(0);
    const changeSinceLastSave = useRef(false);
    const contentRef = useRef(content);
    const pageTitleRef = useRef(pageTitle);
    const lastChange = useRef(new Date().getTime());

    const TIMETOSAVE = 500;

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ color: [] }, { background: [] }],
            ['link', 'image', 'video'],
            ['code-block'],
            ['clean']
        ],
        clipboard: {
            matchVisual: false //Keeps Quill from adding empty paragraphs
        }
    };

    const handleContentChange = (content) => {
        setContent(content);
        changeSinceLastSave.current = true;
        lastChange.current = new Date().getTime();
        contentRef.current = content;
    }

    const savePage = async () => {
        console.log('Saving page...')
        let update = {
            title: pageTitleRef.current,
            content: contentRef.current,
            subPages: page.subPages
        }
        updatePage(page._id, update, workbookId)
    }

    //Save the page every 1 seconds
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
    }, [])


    return (
        <div className='page'>
            <input
                type="text"
                value={pageTitle}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                className='page_title_input'
            />
            {/*<ReactQuill theme="snow" value={content} onChange={handleContentChange} modules={modules} />*/}
            <Tiptap saveHandler={handleContentChange} value={content} key={page._id} />
        </div>
    )
}

export default Page