import React, { useEffect, useState, useContext } from 'react';
import styles from './Chat.module.css';
import { AuthContext } from '../../context/AuthContext';
import withAuth from '../withAuth/WithAuth';
import { useChat } from 'ai/react'
import { MdOutlineAssignment, MdMenuBook, MdClose } from 'react-icons/md';

const Chat = ({ currentPage, workbook }) => {
    const { workbooks, user, authToken, track } = useContext(AuthContext);

    const [contextOption, setContextOption] = useState('current-page')
    const [contextPages, setContextPages] = useState([])
    const [showSelectPages, setShowSelectPages] = useState(false)

    const [errorMessage, setErrorMessage] = useState("");

    const { append, messages, setMessages, input, setInput, handleInputChange, stop, isLoading } = useChat({
        'api': '/api/chat',
        'id': 'notebook-chat',
        onError: err => {
            console.error(err)
            setErrorMessage(err.message)
        },
        onFinish: () => {
            setErrorMessage("")
            const order = fetch('/api/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    tokens: -1,
                    type: 'sidebar chat',
                    userid: user._id
                })
            })

            track('Sidebar chat', {
                'Messages': messages.length + 1
            })
        }
    })

    const extractText = (html) => {
        let span = document.createElement('span');
        span.innerHTML = html;
        return span.textContent || span.innerText;
    }

    const sendMessage = () => {
        if (isLoading) return;
        if (!input) {
            setErrorMessage("Please enter a message")
            return;
        }
        let newMessage = input;
        setInput('')

        console.log(currentPage)

        //Now let's append the context
        let context = '';
        for (let i = 0; i < contextPages.length; i++) {
            if (!contextPages[i]?.content || !contextPages[i]?.title) continue;
            context += 'Title: ' + contextPages[i].title + '. Content: ' + extractText(contextPages[i].content) + '.\n'
        }


        newMessage = "###NOTES START###\n" + context + "###NOTES END###\n" + newMessage;
        let newMessageObj = {
            role: 'user',
            content: newMessage
        }
        console.log(context)

        //This triggers the API to send a response
        append(newMessageObj);

        removeContext();

        //Scroll down to bottom now
        let chat = document.getElementById('notebook-chat-scrollable');
        chat.scrollTop = chat.scrollHeight;
    }

    const clearHandler = () => {
        setInput('')
        setMessages([])
    }

    useEffect(() => {
        let chat = document.getElementById('notebook-chat-scrollable');
        chat.scrollTop = chat.scrollHeight;

        //Save in local storage
        localStorage.setItem('notebook-chat', JSON.stringify(messages));
    }, [messages])

    useEffect(() => {
        //Load from local storage
        let localMessages = JSON.parse(localStorage.getItem('notebook-chat'));
        if (localMessages) {
            setMessages(localMessages);
        }
    }, [])

    useEffect(() => {
        if (contextOption == 'current-page') {
            console.log("Setting current page", currentPage);
            setContextPages([currentPage]);
        }
    }, [currentPage])

    useEffect(() => {
        if (contextOption === 'current-page') {
            document.getElementById('currentPage').classList.add(styles.active);
            document.getElementById('choosePages').classList.remove(styles.active);

            setContextPages([currentPage]);
        } else {
            document.getElementById('currentPage').classList.remove(styles.active);
            document.getElementById('choosePages').classList.add(styles.active);
        }
    }, [contextOption, workbook])

    useEffect(() => {
        removeContext();
    }, [messages])

    //Update workbook when context changes
    useEffect(() => {
        //First, let's find the workbook that the current page belongs to based on the prop
        let updatedWorkbook = workbooks.find(w => w._id === workbook._id);

        //Now let's update the pages in contextPages
        let updatedPages = [];
        for (let i = 0; i < contextPages.length; i++) {
            let updatedPage = updatedWorkbook.pages.find(p => p._id === contextPages[i]._id);
            updatedPages.push(updatedPage);
        }

        //Now let's update the contextPages if the context option is set to that
        if (contextOption === 'choose-pages') {
            setContextPages(updatedPages);
        }


        //Now, let's update the current page
        let updatedCurrentPage = updatedWorkbook.pages.find(p => p._id === currentPage._id);
        currentPage = updatedCurrentPage;

        //Finally, let's update the workbook
        workbook = updatedWorkbook;
    }, [workbooks])

    const removeContext = () => {
        let newMessages = [...messages];
        for (let i = 0; i < newMessages.length; i++) {
            if (newMessages[i].content.includes('###NOTES START###')) {
                let contextStartIndex = newMessages[i].content.indexOf('###NOTES START###');
                let contextEndIndex = newMessages[i].content.indexOf('###NOTES END###');
                let context = newMessages[i].content.substring(contextStartIndex, contextEndIndex + '###NOTES END###\n'.length);
                let messageWithoutContext = newMessages[i].content.replace(context, '');
                newMessages[i].content = messageWithoutContext;
            }
        }

        setMessages(newMessages);
    }



    return (
        <>
            <div className={styles.chat} id="notebook-chat">
                <div className={styles.scrollable} id="notebook-chat-scrollable">
                    <div className={styles.top}>
                        <h1 className={styles.header}>Chat</h1>
                        <span className={styles.answerFromText}>Answering user context from</span>
                        <div className={styles.contextBox} id='currentPage' onClick={() => { console.log("Setting current page"); setContextOption('current-page') }}>
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
                            {
                                contextPages.length === 0 &&
                                <span className={styles.contextPage}>No pages selected</span>
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
                        </div>
                    </div>
                </div>
                <div className={styles.bottom}>
                    <>
                        {
                            errorMessage &&
                            <>
                                <div className={styles.errorMessage}>{errorMessage}</div>
                            </>
                        }
                        {
                            isLoading && <div className={styles.stop} onClick={stop}>Stop</div>
                        }
                        <div className={styles.clearButton} onClick={clearHandler}>Clear</div>
                        <div className={styles.inputContainer}>
                            <textarea rows="3" className={styles.newMessageInput} value={input} onChange={handleInputChange}></textarea>
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

export default withAuth(Chat);