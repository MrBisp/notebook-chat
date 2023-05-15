import React, { useEffect, useState, useContext } from 'react';
import styles from './Chat.module.css';
import axios from 'axios';
import Link from 'next/link';
import { AuthContext } from '../../context/AuthContext';
import withAuth from '../withAuth/WithAuth';
import { MdMenu } from 'react-icons/md';


const Chat = () => {
    const technicalSystemMessage = "Respond with html. For example links in a <a> tag. To insert a code block use following syntax: <pre><code className=\"js\">{`your code`\}</code></pre>"

    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');

    const [isReady, setIsReady] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    const [aiMessage, setAiMessage] = useState('');

    const [results, setResults] = useState([]);

    const [model, setModel] = useState('');
    const [systemMessage, setSystemMessage] = useState('');
    const [token, setToken] = useState('');
    const AiMessages = [
        "Generating answer...",
    ]

    const { user, selectedConversation, addMessage, addConversation, updateConversation } = useContext(AuthContext);

    const [showOnMobile, setShowOnMobile] = useState(false);

    useEffect(() => {
        if (selectedConversation) {
            setMessages(selectedConversation.messages);
            setSystemMessage(selectedConversation.systemMessage);
            setModel(selectedConversation.model);
        } else {
            setMessages([]);
            setSystemMessage('');
            setModel('');
        }
        if (user) {
            console.log('User: ' + JSON.stringify(user));
            setToken(user.token);
        }
    }, [selectedConversation, user]);

    //Set sendNew to false, if you want to try to send the message again
    const sendMessage = async (sendNew = true) => {
        console.log('Trying to send a new message')
        setErrorMessage('');
        if (isReady === false) return;
        if (message === '' && sendNew) return;

        //Let's first check if the user has a token
        if (!token) {
            setErrorMessage("You need to set your token in the settings.");
            setIsReady(true);
            return;
        }

        let newConversationObject = null;

        //If there is not a selected conversation, let's first make a new conversation
        if (!selectedConversation) {
            console.log('No selected conversation, creating a new one')
            let newConversation = await addConversation();

            if (!newConversation) {
                setErrorMessage("Something went wrong. Please try again.");
                setIsReady(true);
                return;
            }
            newConversationObject = newConversation;
        }
        //If we just created a new conversation, we need to set the selected conversation to the new conversation
        let useId = null;
        if (newConversationObject) {
            useId = newConversationObject.id;
        } else {
            useId = selectedConversation.id;
        }

        setIsReady(false);
        setErrorMessage('');

        let newMessage = { content: message, role: "user" };

        //Make a copy of the messages array, and add the new message to it
        let allMessages = [...messages];

        setMessage('');


        //If sendNew = false, then we are trying to send the message again
        if (sendNew === false) {
            //Remove the last message from the messages array
            //allMessages.pop();
            //TODO: Implement this
            //Actually, by doing nothing we are just asking GPT for a response. Would work in most cases but not all.
        } else {
            allMessages.push(newMessage);

            //First we add the user's message to the messages array
            let addedUserMessage = await addMessage(useId, newMessage);

            if (!addedUserMessage) {
                setErrorMessage("Something went wrong. Please try again.");
                setIsReady(true);
                return;
            }
        }

        //Scroll the chat to the bottom
        scrollToBottom();

        //Set a random message from the AiMessages array (loading message)
        setAiMessage(AiMessages[Math.floor(Math.random() * AiMessages.length)]);

        let useModel = null;
        let useSystemMessage = null;
        if (newConversationObject) {
            useModel = newConversationObject.model;
            useSystemMessage = newConversationObject.systemMessage;
        } else {
            useModel = model;
            useSystemMessage = systemMessage;
        }

        try {
            const response = await axios.post('/api/chat', {
                messages: allMessages,
                model: useModel,
                systemMessage: useSystemMessage + ' ' + technicalSystemMessage,
                token: token
            });
            console.log('Response from chat api: ')
            console.log(response.data)
            //Add the response to the messages array
            let newAIMessage = { content: response.data.message, role: "assistant" };

            //Add the message to the messages array
            await addMessage(useId, newAIMessage);

            scrollToBottom();

            //If it is a new conversation, automatically generate a name for it 
            if (newConversationObject && false) {
                //Add the new AI message to the messages array
                allMessages.push(newAIMessage);

                const response = await axios.post('/api/generate-name', {
                    messages: allMessages,
                    token: token
                });
                if (response.message) {
                    console.log('Response from generate name api: ')
                    console.log(response.data)
                    //Add the response to the messages array
                    let newName = response.data.message;

                    //Add the message to the messages array
                    await updateConversation(useId, { name: newName })
                }
            }

        } catch (error) {
            console.log("Error");
            console.log(error);
            setErrorMessage("Something went wrong. Please try again.");
        }

        setIsReady(true);
    }

    const scrollToBottom = () => {
        //First wait 500 ms
        setTimeout(() => {
            //Then scroll to the bottom
            const messagesInner = document.getElementById('messagesContainer');
            messagesInner.scrollTop = messagesInner.scrollHeight;
        }, 50);
    }

    useEffect(() => {
        console.log('Messages changed');
        console.log(messages);
    }, [messages]);

    useEffect(() => {
        if (showOnMobile) {
            let conversationsContainer = document.getElementById('conversationscontainer');
            conversationsContainer.classList.add('showOnMobile');

            let mainContainer = document.getElementById('main-container__left');
            mainContainer.classList.add('showOnMobile');
        } else {
            let conversationsContainer = document.getElementById('conversationscontainer');
            conversationsContainer.classList.remove('showOnMobile');

            let mainContainer = document.getElementById('main-container__left');
            mainContainer.classList.remove('showOnMobile');
        }
    }, [showOnMobile]);

    return (
        <>
            <div className={styles.hamburger} id="hamburger" onClick={() => { setShowOnMobile(!showOnMobile) }}>
                <MdMenu />
            </div>
            <div className={styles.chat}>
                <h1 className={styles.header}>{selectedConversation && selectedConversation.name}</h1>
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
                                        <div className={styles.messagecontent}>Hey dude, what's up?</div>
                                    </div>
                                    <div className={styles.message} data-sender="assistant">
                                        <div className={styles.messagecontent}>
                                            Here are some things you can ask me about:
                                            <ul>
                                                <li>How to get a Finnish girlfriend?</li>
                                                <li>What is the meaning of life?</li>
                                                <li>Who is the best Youtuber of all time?</li>
                                            </ul>
                                        </div>
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
                <div className={styles.bottom}>
                    <>
                        {
                            errorMessage &&
                            <>
                                <div className={styles.errorMessage}>{errorMessage}</div>
                                <span className={styles.sendAgain} onClick={() => sendMessage(false)}>Send again</span>
                            </>
                        }
                        <div className={styles.inputContainer}>
                            <textarea rows="3" className={styles.newMessageInput} value={message} onChange={(e) => setMessage(e.target.value)}></textarea>
                            <button className={styles.newMessageButton} onClick={sendMessage}>Send</button>
                        </div>
                    </>
                </div>
            </div >
        </>
    )

}

export default withAuth(Chat);