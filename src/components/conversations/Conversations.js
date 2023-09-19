import React, { useEffect, useState } from 'react';
import styles from './Conversations.module.css';
import axios from 'axios';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import withAuth from '../withAuth/WithAuth';

import { MdDeleteOutline } from "react-icons/md";
import { MdSettings } from 'react-icons/md';
import { MdClose } from 'react-icons/md';

const Conversations = () => {

    const { user, conversations, selectedConversation, addConversation, selectConversation, deleteConversation, updateConversation, updateUserToken, logout } = useContext(AuthContext);

    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [conversationToUpdate, setConversationToUpdate] = useState(null);
    const [conversationName, setConversationName] = useState('');
    const [model, setModel] = useState(false);
    const [token, setToken] = useState("");
    const [systemMessage, setSystemMessage] = useState(false);

    const defaultSystemMessage = 'You are an awesome chatbot! Try to be as helpful as possible to the user. Answer any questions that the user might have in any language.';
    const defaultModel = 'gpt-3.5-turbo';

    const [showSettingsModal, setShowSettingsModal] = useState(false);

    useEffect(() => {
        if (conversations) {
            console.log('Selected conversation: ' + JSON.stringify(selectedConversation));
        }
    }, [conversations, selectedConversation]);

    useEffect(() => {
        if (conversationToUpdate) {
            setConversationName(conversationToUpdate.name);
            setModel(conversationToUpdate.model);
            setSystemMessage(conversationToUpdate.systemMessage);
        }
        if (user) {
            setToken(user.token);
        }
    }, [conversationToUpdate, user]);

    const handleAddConversation = () => {
        addConversation();

        //Simulate a click on the hamburger menu
        const hamburger = document.getElementById('hamburger');
        hamburger.click();
    };

    const handleConversationClick = (id) => {
        console.log('Conversation clicked: ' + id);
        selectConversation(id);

        //Simulate a click on the hamburger menu
        const hamburger = document.getElementById('hamburger');
        hamburger.click();
    };

    const handleDeleteConversation = async (e, id) => {
        e.stopPropagation();

        if (!confirm('Are you sure you want to delete this conversation?')) return;

        console.log('Deleting conversation: ' + id);
        deleteConversation(id);

        //If the conversation that was deleted was the selected conversation, we need to select another conversation
        if (selectedConversation && selectedConversation.id === id) {
            selectConversation(null);
        }
    };

    const openOptionsModal = (e, id) => {
        e.stopPropagation();

        console.log('Opening options modal');
        setShowOptionsModal(true);

        const conversation = conversations.find((conversation) => conversation.id === id);
        setConversationToUpdate(conversation);
    };

    const handleUpdateConversation = async (id) => {
        console.log('Updating conversation: ' + id);

        const data = {
            name: conversationName,
            model: model,
            systemMessage: systemMessage
        };

        updateConversation(id, data);

        setShowOptionsModal(false);
    };

    const handleUpdateToken = async () => {
        console.log('Updating token: ' + token);

        const data = {
            token: token
        };

        await updateUserToken(data);

        setShowSettingsModal(false);
    };

    const logOutHandler = async () => {
        console.log('Logging out');
        logout();
    };

    return (
        <>
            <div className={styles.conversations} id="conversationscontainer">
                <div className={styles.topContainer}>
                    <h3 className={styles.conversationHeader}>Chats</h3>
                    <div className={styles.conversation_new_container} onClick={handleAddConversation}>
                        <span className={styles.conversation_new}>+ New chat</span>
                    </div>
                </div>
                <div className={styles.middleContainer}>
                    {conversations && conversations.reverse().map((conversation, index) => (
                        <div key={index} className={styles.conversation} data-id={conversation.id} onClick={() => { handleConversationClick(conversation.id) }}>
                            <span className={styles.conversation__name}>{conversation.name}</span>
                            <span className={styles.conversation_hover}>
                                <MdSettings onClick={(e) => { openOptionsModal(e, conversation.id) }} />
                                <MdDeleteOutline onClick={(e) => { handleDeleteConversation(e, conversation.id) }} />
                            </span>
                        </div>
                    ))}
                </div>
                <div className={styles.bottomContainer}>
                    <div className={styles.settings} onClick={() => { setShowSettingsModal(true) }}>
                        Settings
                    </div>
                </div>
            </div>
            {
                showOptionsModal &&
                <div className={styles.optionsOverlay} >
                    <div className={styles.optionsContainer}>
                        <div className={styles.optionsTitle}>Options</div>
                        <div className={styles.optionsClose} onClick={() => { setShowOptionsModal(false); setConversationToUpdate(null); }}><MdClose /></div>

                        <div className={styles.optionsContent}>
                            <div className={styles.option}>
                                <span className={styles.optionsLabel}>Name</span>
                                <input className={styles.optionsInput} value={conversationName} onChange={(e) => setConversationName(e.target.value)}></input>
                            </div>
                            <div className={styles.option}>
                                <span className={styles.optionsLabel}>Model</span>
                                <select className={styles.optionsSelect} value={model} onChange={(e) => setModel(e.target.value)}>
                                    <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                                    <option value="gpt-4">gpt-4</option>
                                </select>
                            </div>
                            <div className={styles.option}>
                                <span className={styles.optionsLabel}>System message</span>
                                <textarea rows={5} className={styles.optionsTextarea} value={systemMessage} onChange={(e) => setSystemMessage(e.target.value)}></textarea>
                            </div>
                        </div>
                        <div className={styles.optionsButtons}>
                            <button className={styles.optionsResetButton} onClick={() => { setModel(defaultModel); setSystemMessage(defaultSystemMessage); }}>Reset</button>
                            <button className={styles.optionsSaveButton} onClick={() => handleUpdateConversation(conversationToUpdate.id)}>Save</button>
                        </div>
                    </div>
                </div >
            }
            {
                showSettingsModal &&
                <div className={styles.optionsOverlay} >
                    <div className={styles.optionsContainer}>
                        <div className={styles.optionsTitle}>Settings</div>
                        <div className={styles.optionsClose} onClick={() => { setShowSettingsModal(false); }}><MdClose /></div>

                        <div className={styles.optionsContent}>
                            <div className={styles.option}>
                                <span className={styles.optionsLabel}>API Token</span>
                                <input className={styles.optionsInput} value={token} onChange={(e) => setToken(e.target.value)}></input>
                                <span className={styles.optionsTip}>You can find or create your API token at <a href="https://platform.openai.com/account/api-keys">OpenAI's website</a>.</span>
                            </div>
                        </div>
                        <div className={styles.optionsContent}>
                            <div className={styles.option}>
                                <span className={styles.optionsLabel} onClick={logOutHandler}>Log out</span>
                            </div>
                        </div>
                        <div className={styles.optionsButtons}>
                            <button className={styles.optionsResetButton} onClick={() => { setToken("") }}>Reset</button>
                            <button className={styles.optionsSaveButton} onClick={() => { handleUpdateToken() }}>Save</button>
                        </div>
                    </div>

                </div>
            }
        </>
    )
}

export default withAuth(Conversations);