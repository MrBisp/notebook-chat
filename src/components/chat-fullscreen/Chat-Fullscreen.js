import React, { useEffect, useState, useContext } from 'react';
import styles from './Chat-Fullscreen.module.css';
import { AuthContext } from '../../context/AuthContext';
import withAuth from '../withAuth/WithAuth';
import { useChat } from 'ai/react'
import { MdOutlineAssignment, MdMenuBook, MdClose, MdSend } from 'react-icons/md';
import { useRouter } from 'next/router';

const ChatFullscreen = ({ }) => {
    const { user, authToken, logout, loading, workbooks } = useContext(AuthContext);

    const [errorMessage, setErrorMessage] = useState('');
    const [makingResponse, setMakingResponse] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();

    const { append, messages, setMessages, stop, complete } = useChat({
        'api': '/api/fullscreen-chat/function',
        'id': 'fullscreen-chat',
        initialMessages: [{
            role: 'assistant',
            content: 'Hello, I\'m the AI behind Notebook-Chat. I have access to your notes and can search through them to help you find the information you need. How can I assist you today?'
        }],
        onError: err => {
            console.error(err)
            setErrorMessage(err.message)
        },
        onFinish: (f) => {
            setErrorMessage("")
            setIsLoading(false)
            console.log(f);
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
        console.log(buttonMessage)
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

        console.log('Getting pages from pinecone')

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
        console.log(context)

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

        console.log('Messages changed', messages)

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
        console.log(results);


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
        switch (message) {
            case 'start':
                await sendMessageWithFunction("How do I get started with Notebook-Chat?")
                break;
            case 'work':
                await sendMessageWithFunction("How does Notebook-Chat work?")
                break;
            default:
                break;
        }
    }

    return (
        <div className={styles.mainContainer}>
            <div className={styles.chatContainer}>
                <div id="chat-fullscreen-scrollable" className={styles.scrollable}>
                    <div className={styles.chatHeader}>
                        <h1>Ask anything, your notes are the limits</h1>
                        <p>
                            Just type your question, and I'll find the most relevant information from your notes to give you an accurate answer.
                        </p>
                        <div className={styles.buttonContainer}>
                            <button className={styles.question} onClick={() => { sendMessageWithButton("start") }}>✨ How do I get started?</button>
                            <button className={styles.question} onClick={() => { sendMessageWithButton("work") }}>✨ How does Notebook-Chat work?</button>
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