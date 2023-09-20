import React, { useEffect, useState, useContext } from 'react';
import styles from './Chat-Fullscreen.module.css';
import { AuthContext } from '../../context/AuthContext';
import withAuth from '../withAuth/WithAuth';
import { useChat } from 'ai/react'
import { MdOutlineAssignment, MdMenuBook, MdClose, MdSend } from 'react-icons/md';
import { useRouter } from 'next/router';

const ChatFullscreen = ({ }) => {
    const { user, authToken, logout, loading, workbooks, track } = useContext(AuthContext);

    const [errorMessage, setErrorMessage] = useState('');
    const [makingResponse, setMakingResponse] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [suggestedMessages, setSuggestedMessages] = useState([]);

    const router = useRouter();

    const { append, messages, setMessages, stop, complete } = useChat({
        'api': '/api/fullscreen-chat/function',
        'id': 'fullscreen-chat',
        onError: err => {
            console.error(err)
            setErrorMessage(err.message)
        },
        onFinish: (f) => {
            setErrorMessage("")
            setIsLoading(false)

            const order = fetch('/api/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    tokens: -1,
                    type: 'fullscreen chat',
                    userid: user._id
                })
            })

            track('Fullscreen Chat', {
                'Messages': messages.length
            })
        },
        onResponse: () => {
            setIsLoading(false)
        },
        headers: {
            'Content-Type': 'application/json',
            'authorization': 'Bearer ' + authToken
        }
    })

    const extractText = (html) => {
        let span = document.createElement('span');
        span.innerHTML = html;
        return span.textContent || span.innerText;
    }

    const sendMessageWithFunction = async (buttonMessage = null) => {
        if (isLoading) return;
        if (!input && !buttonMessage) {
            setErrorMessage("Please enter a message")
            return;
        }
        let newMessage = input;
        setInput('');
        setIsLoading(true);

        let newMessageObj = {
            role: 'user',
            content: buttonMessage ? buttonMessage : newMessage
        }

        //This triggers the API to send a response
        append(newMessageObj, {
            headers: {
                'Content-Type': 'application/json',
                'authorization': 'Bearer ' + authToken
            }
        });

        //Scroll down to bottom now
        let chat = document.getElementById('chat-fullscreen-scrollable');
        chat.scrollTop = chat.scrollHeight;
    }

    const sendMessage = async () => {
        if (isLoading) return;
        if (!input) {
            setErrorMessage("Please enter a message")
            return;
        }
        let newMessage = input;
        setInput('');
        setIsLoading(true);

        //Now let's append the context
        const pages = await getPagesFromPinecone(newMessage);
        let context = '';
        pages.forEach((page) => {
            context += extractText(page.title + ': ' + page.content) + '\n';
        })

        newMessage = "###NOTES START###\n" + context + "###NOTES END###\n" + newMessage;
        let newMessageObj = {
            role: 'user',
            content: newMessage
        }

        //This triggers the API to send a response
        append(newMessageObj, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });

        //Scroll down to bottom now
        let chat = document.getElementById('chat-fullscreen-scrollable');
        chat.scrollTop = chat.scrollHeight;
    }

    const clearHandler = () => {
        setInput('')
        setMessages([])
    }

    useEffect(() => {
        let chat = document.getElementById('chat-fullscreen-scrollable');
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

    const getPagesFromPinecone = async (query) => {
        const url = "/api/pinecone/notes";
        const headers = {
            'Content-Type': 'application/json',
            'authorization': `Bearer ${authToken}`
        }
        const body = {
            content: query
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        })
        const data = await response.json();
        const results = data.results;


        //Now let's see if it matches one of the page id's
        let pages = workbooks.reduce((acc, workbook) => {
            let pages = workbook.pages.filter((page) => {
                if (page.result <= 0.7) return false;
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

        return pages;
    }

    const sendMessageWithButton = async (message) => {
        await sendMessageWithFunction(message);
        track('Fullscreen Chat button click', {
            'Message': message
        })
    }

    //Get suggested messages
    useEffect(() => {
        if (typeof window !== 'undefined') {

            //First, let's check in localstorage if we have the suggested messages
            let localSuggestedMessages = JSON.parse(localStorage.getItem('suggested-messages'));
            if (localSuggestedMessages) {

                //Now lets check if it is more than 24 hours old
                let now = new Date();
                let lastUpdated = new Date(localSuggestedMessages.lastUpdated);
                let diff = now - lastUpdated;
                let hours = Math.floor(diff / 1000 / 60 / 60);
                if (hours > 24) {
                    //It's too old, let's update it
                    localStorage.removeItem('suggested-messages');
                } else {
                    setSuggestedMessages(localSuggestedMessages.messages);
                    return;
                }
            }

            const url = "/api/ai/suggestedMessages";
            const headers = {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${authToken}`
            }

            const suggestedMessages = fetch(url, {
                method: 'POST',
                headers: headers,
            }
            ).then((response) => response.json())
                .then((data) => {
                    console.log(data);
                    console.log(JSON.parse(data.response));

                    let parsed = JSON.parse(data.response);
                    let suggestion1 = parsed.question1;
                    let suggestion2 = parsed.question2;
                    let suggestion3 = parsed.question3;

                    setSuggestedMessages([suggestion1, suggestion2, suggestion3]);

                    //Save in local storage
                    localStorage.setItem('suggested-messages', JSON.stringify({
                        lastUpdated: new Date(),
                        messages: [suggestion1, suggestion2, suggestion3]
                    }));

                    //Make a new order
                    const order = fetch('/api/order', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'authorization': `Bearer ${authToken}`
                        },
                        body: JSON.stringify({
                            tokens: -1,
                            type: 'fullscreen chat button suggestions',
                            userid: user._id
                        })
                    })
                }
                );
        }
    }, [])

    //Make the first message
    useEffect(() => {

        if (typeof window == 'undefined') {
            setMessages([{
                role: 'assistant',
                content: 'Hello, I\'m the AI behind Notebook-Chat. How can I assist you today?'
            }])
        }

        //Let's check if the user has any pages in their workbooks
        if (workbooks.length === 0) {
            console.log("No workbooks")
            setMessages([{
                role: 'assistant',
                content: 'Hello, I\'m the AI behind Notebook-Chat. How can I assist you today?'
            }])
            return;
        }

        //Loop through the workbooks and pages and get the content
        const pages = workbooks.reduce((acc, workbook) => {
            return [...acc, ...workbook.pages];
        }, []);

        //Let's check if the user has any pages
        if (pages.length === 0) {
            console.log("No pages")
            setMessages([{
                role: 'assistant',
                content: 'Hello, I\'m the AI behind Notebook-Chat. How can I assist you today?'
            }])
            return;
        }

        //First, let's check in localstorage if we have a message
        let localMessages = JSON.parse(localStorage.getItem('first-message'));
        if (localMessages) {
            //Now lets check if it is more than 24 hours old
            let now = new Date();
            let lastUpdated = new Date(localMessages.lastUpdated);
            let diff = now - lastUpdated;
            let hours = Math.floor(diff / 1000 / 60 / 60);
            if (hours > 24) {
                //It's too old, let's update it
                localStorage.removeItem('first-message');
            } else {
                setMessages(localMessages.messages);
                return;
            }
        }

        const url = "/api/ai/startConversation";
        const headers = {
            'Content-Type': 'application/json',
            'authorization': `Bearer ${authToken}`
        }

        //It's too old, let's update it
        localStorage.removeItem('first-message');

        const firstMessage = fetch(url, {
            method: 'POST',
            headers: headers,
        }).then((response) => response.json())
            .then((data) => {
                console.log(data);
                console.log(JSON.parse(data.response));

                let parsed = JSON.parse(data.response);
                let firstMessage = parsed.message;

                setMessages([{
                    role: 'assistant',
                    content: firstMessage
                }]);

                //Save in local storage
                localStorage.setItem('first-message', JSON.stringify({
                    lastUpdated: new Date(),
                    messages: [{
                        role: 'assistant',
                        content: firstMessage
                    }]
                }));

                //Make a new order
                const order = fetch('/api/order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({
                        tokens: -1,
                        type: 'fullscreen chat first message',
                        userid: user._id
                    })
                })

            }
            );
    }, [])

    return (
        <div className={styles.mainContainer}>
            <div className={styles.chatContainer}>
                <div id="chat-fullscreen-scrollable" className={styles.scrollable}>
                    <div className={styles.chatHeader}>
                        <h1>Ask anything, your notes are the limits</h1>
                        <div className={styles.buttonContainer}>
                            {
                                suggestedMessages.map((message, index) => {
                                    return (
                                        <button key={index} onClick={() => { sendMessageWithButton(message) }}>✨ {message}</button>
                                    )
                                })
                            }
                        </div>
                    </div>
                    <div className={styles.chatBody}>
                        {
                            messages.map((message, index) => {
                                if (message.role == 'user') {
                                    return (
                                        <div key={index} className={styles.messageContainer}>
                                            <div className={styles.userMessage}>
                                                <p>{message.content}</p>
                                            </div>
                                        </div>
                                    )
                                } else if (message.role == 'assistant') {
                                    return (
                                        <div key={index} className={styles.messageContainer}>
                                            <div className={styles.botMessage}>
                                                <p>{message.content}</p>
                                            </div>
                                        </div>
                                    )
                                }
                            })
                        }
                        {
                            errorMessage && (
                                <div className={styles.messageContainer}>
                                    <div className={styles.botMessage}>
                                        <p>{errorMessage}</p>
                                    </div>
                                </div>
                            )
                        }
                        {
                            isLoading && (
                                <div className={styles.messageContainer}>
                                    <div className={styles.botMessage}>
                                        <p>Thinking...</p>
                                    </div>
                                </div>
                            )
                        }
                    </div>
                </div>
                <div className={styles.chatFooter}>
                    <div className={styles.inputContainer}>
                        <textarea placeholder="Type your question here" onChange={(e) => { setInput(e.target.value) }} rows={1} value={input}></textarea>
                        <button onClick={() => { sendMessageWithFunction() }}><MdSend /></button>
                    </div>
                </div>
            </div>
        </div>
    )

}

export default withAuth(ChatFullscreen);