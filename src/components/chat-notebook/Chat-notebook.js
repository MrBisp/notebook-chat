import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import styles from './Chat-notebook.module.css';
import { MdMenuBook, MdOutlineAssignment, MdClose } from 'react-icons/md'; //Possibly change to MdMenuBook MdOutlineAssignment MdOutlineListAlt MdOutlineMargin MdOutlineTextSnippet


const ChatNotebook = ({ currentPage, workbook }) => {
    const { addPage, sendNotebookChatMessage } = useContext(AuthContext);

    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');

    const [aiMessage, setAiMessage] = useState('Making a response...');
    const [isReady, setIsReady] = useState(true);

    const [contextOption, setContextOption] = useState('current-page'); // current-page or choose-pages
    const [contextPages, setContextPages] = useState([currentPage]); // [page1, page2, page3
    const [showSelectPages, setShowSelectPages] = useState(false); // [page1, page2, page3

    const [errorMessage, setErrorMessage] = useState('');

    const extractText = (html) => {
        let span = document.createElement('span');
        span.innerHTML = html;
        return span.textContent || span.innerText;
    }


    const sendMessage = async () => {
        if (!isReady) return;

        if (message === '') {
            setErrorMessage('Please enter a message');
            return;
        }

        setIsReady(false);

        let newMessage = {
            role: 'user',
            content: message
        }

        let context = ''
        if (contextOption === 'current-page') {
            context = 'Title: ' + currentPage.title + '. Content: ' + extractText(currentPage.content) + '.\n'
        } else {
            for (let i = 0; i < contextPages.length; i++) {
                context += 'Title: ' + contextPages[i].title + '. Content: ' + extractText(contextPages[i].content) + '.\n'
            }
        }

        let allMessages = [...messages, newMessage];

        setMessages(allMessages);
        setMessage('');

        let chat = document.getElementById('notebook-chat-scrollable');
        chat.scrollTop = chat.scrollHeight;

        let response = await sendNotebookChatMessage(allMessages, context);

        if (response) {
            setIsReady(true);

            //Scroll to bottom
            let chat = document.getElementById('notebook-chat-scrollable');
            chat.scrollTop = chat.scrollHeight;


            let aiMessage = {
                role: 'assistant',
                content: response
            }

            setMessages([...allMessages, aiMessage]);
        } else {
            setErrorMessage('Something went wrong. Please try again later.');
        }

        setIsReady(true);
    }

    useEffect(() => {
        if (contextOption === 'current-page') {
            document.getElementById('currentPage').classList.add(styles.active);
            document.getElementById('choosePages').classList.remove(styles.active);

            setContextPages([currentPage]);
        } else {
            document.getElementById('currentPage').classList.remove(styles.active);
            document.getElementById('choosePages').classList.add(styles.active);
        }
    }, [contextOption])

    const clearHandler = () => {
        setMessages([]);
        setIsReady(true);
    }

    return (
        <>
            <div className={styles.chat} id="notebook-chat">
                <div className={styles.scrollable} id="notebook-chat-scrollable">
                    <div className={styles.top}>
                        <h1 className={styles.header}>Chat</h1>
                        <span className={styles.answerFromText}>Answering user context from</span>
                        <div className={styles.contextBox} id='currentPage' onClick={() => { setContextOption('current-page') }}>
                            <MdOutlineAssignment />
                            <span>Current page</span>
                        </div>
                        <div className={styles.contextBox} id='choosePages' onClick={() => { setContextOption('choose-pages'); setShowSelectPages(true) }}>
                            <MdMenuBook />
                            <span>Choose pages</span>
                        </div>
                        <div className={styles.currentContext}>
                            {
                                contextPages.length > 0 &&
                                contextPages.map((page, index) => {
                                    if (page?.title) {
                                        return (
                                            <span key={index} className={styles.contextPage}>{index + 1 == contextPages.length ? page.title : page.title + ', '}</span>
                                        )
                                    }
                                })
                            }

                        </div>
                    </div>
                    <div className={styles.messages} id="messagesContainer">
                        <div className={styles.messagesInner}>
                            {
                                messages.length > 0 ?
                                    messages.map((message, index) => {
                                        return (
                                            <div key={index} className={message.role}>
                                                <div className={styles.message} data-sender={message.role}>
                                                    {
                                                        message.role === 'assistant' && <div className={styles.messagecontent} dangerouslySetInnerHTML={{ __html: message.content }}></div>
                                                    }
                                                    {
                                                        message.role === 'user' && <div className={styles.messagecontent}>{message.content}</div>
                                                    }

                                                </div>
                                            </div>
                                        )
                                    })
                                    :
                                    <>
                                        <div className={styles.message} data-sender="assistant">
                                            <div className={styles.messagecontent}>Ask me something interesting!</div>
                                        </div>
                                    </>
                            }
                            {
                                isReady === false &&
                                <div className={styles.message} data-sender="loading">
                                    <div className={styles.messagecontent}>{aiMessage}</div>
                                </div>
                            }
                        </div>
                    </div>
                </div>
                <div className={styles.bottom}>
                    <>
                        {
                            errorMessage &&
                            <>
                                <div className={styles.errorMessage}>{errorMessage}</div>
                                <span className={styles.sendAgain} onClick={() => sendMessage(false)}>Send again</span>
                            </>
                        }
                        <div className={styles.clearButton} onClick={clearHandler}>Clear</div>
                        <div className={styles.inputContainer}>
                            <textarea rows="3" className={styles.newMessageInput} value={message} onChange={(e) => setMessage(e.target.value)}></textarea>
                            <button className={styles.newMessageButton} onClick={sendMessage}>Send</button>
                        </div>
                    </>
                </div>
            </div >
            {
                showSelectPages &&
                <div className="modal-overlay">
                    <div className='modal'>
                        <div className='modal-header'>
                            <span className='modal-title'>Select which pages to use as context</span>
                            <div className='modal-x' onClick={() => { setShowSelectPages(false); }}><MdClose /></div>
                        </div>
                        <div className='modal-content'>
                            <div className='modal-option'>
                                <span className='modal-option-label'>Pages</span>
                                <div className='modal-option-select-pages'>
                                    {
                                        workbook.pages.map((page, index) => {
                                            //Check if the workbook has a page with the same id as the current page
                                            const isActive = contextPages?.find(p => p?._id === page._id);

                                            const handleClick = () => {
                                                if (isActive) {

                                                    setContextPages(contextPages?.filter(p => p?._id !== page._id)); // Remove the page from contextPages if already active
                                                } else {
                                                    setContextPages([...contextPages, page]); // Add the page to contextPages if not already active
                                                }
                                            };

                                            return (
                                                <div key={index} className={`card card-small ${isActive ? 'active' : ''}`} onClick={handleClick}>
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
                                            );
                                        })
                                    }
                                </div>
                            </div>
                        </div>
                        <div className='modal-footer'>
                            <button className='modal-button-cancel' onClick={() => { setShowSelectPages(false); }}>Close</button>
                            <button className='modal-button' onClick={() => {
                                setShowSelectPages(false);
                            }} >Update</button>
                        </div>

                    </div>
                </div>
            }
        </>
    )
}

export default ChatNotebook;