// AuthContext.js

import { createContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(null);
    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [workbooks, setWorkbooks] = useState([]);

    const [loading, setLoading] = useState(true);
    const [userSet, setUserSet] = useState(false);

    const router = useRouter();

    //Get user data from server on page load
    useEffect(() => {
        logUserIn();
    }, []);

    useEffect(() => {
        if (userSet) {
            setLoading(false);
        }
    }, [userSet]);


    const login = async (email, password) => {
        console.log('Logging in user: ' + email + ' with password: ' + password);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            console.log(data);

            if (!data.authToken) {
                return false;
            }

            localStorage.setItem('authToken', data.authToken);

            await logUserIn();

            return true;
        } catch (error) {
            console.log(error.message);
            return false;
        }
    };

    const logUserIn = async () => {
        const storedAuthToken = localStorage.getItem('authToken');
        console.log('Getting user from token...')

        if (storedAuthToken) {

            const fetchData = async () => {
                try {
                    const response = await fetch('/api/auth/user', {
                        headers: {
                            Authorization: `Bearer ${storedAuthToken}`,
                        },
                    });
                    const data = await response.json();

                    console.log(data);

                    if (!data.user) {
                        return;
                    }

                    setUser(data.user);
                    setConversations(data.user.conversations);
                    setWorkbooks(data.user.workbooks);
                } catch (error) {
                    console.error(error);
                } finally {
                    setUserSet(true);
                    setAuthToken(storedAuthToken);
                }
            };
            fetchData();
        } else {
            setLoading(false);
        }
    };

    const logout = () => {
        setAuthToken(null);
        setUser(null);
        setConversations([]);
        setSelectedConversation(null);
        localStorage.removeItem('authToken');
        router.push('/login');
    };

    const addConversation = async () => {
        try {
            const response = await fetch('/api/conversations?user_id=' + user.id, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
            });
            const data = await response.json();
            console.log("New conversation: " + JSON.stringify(data));
            console.log(data.conversation)

            if (data.conversation) {
                if (conversations.length === 0) setConversations([data.conversation]);
                else {
                    setConversations((prevConversations) => [
                        ...prevConversations,
                        data.conversation,
                    ]);
                }
                setSelectedConversation(data.conversation);
            }
            return data.conversation;
        } catch (error) {
            console.error(error);
        }
    };

    const deleteConversation = async (id) => {
        console.log('Deleting conversation: ' + id);
        try {
            const response = await fetch(`/api/conversations/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ user_id: user.id })
            });
            const data = await response.json();
            console.log(data);

            if (data.success) {

                //If the selected conversion is the one being deleted, set selected conversation to null
                if (selectedConversation && selectedConversation.id === id) {
                    setSelectedConversation(null);
                }

                setConversations((prevConversations) =>
                    prevConversations.filter((conversation) => conversation.id !== id)
                );
            }
        } catch (error) {
            console.error(error);
        }
    };

    const updateConversation = async (id, data) => {
        console.log('Updating conversation: ' + id + ' with data: ' + JSON.stringify(data));
        try {
            const response = await fetch(`/api/conversations/${id}`, {
                method: "PUT",
                body: JSON.stringify({
                    messages: data.messages,
                    systemMessage: data.systemMessage,
                    model: data.model,
                    name: data.name,
                    user_id: user.id
                }),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
            });
            const updatedConversation = await response.json();
            console.log('Updated conversation: ' + JSON.stringify(updatedConversation));

            if (updatedConversation.success) {
                setConversations((prevConversations) =>
                    prevConversations.map((conversation) => {
                        if (conversation.id === id) {
                            return updatedConversation.conversation;
                        }
                        return conversation;
                    })
                );
            }
        } catch (error) {
            console.error(error);
        }
    };

    const addMessage = async (id, message) => {
        console.log('Adding message to conversation: ' + id + ' message: ' + JSON.stringify(message));
        try {
            const response = await fetch(`/api/conversations/${id}/messages`, {
                method: "POST",
                body: JSON.stringify({
                    role: message.role,
                    content: message.content,
                    user_id: user.id,
                    token: message.token,
                }),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
            });
            const data = await response.json();


            if (data.success) {
                console.log('Added message to conversation: ' + JSON.stringify(data));
                setConversations((prevConversations) =>
                    prevConversations.map((conversation) => {
                        if (conversation.id === id) {
                            return data.conversation;
                        }
                        return conversation;
                    })
                );

                setSelectedConversation(data.conversation);
            }
            return data.success;
        } catch (error) {
            console.error(error);
        }
    };

    const updateUserToken = async (data) => {
        console.log('Updating user: ' + user.id + ' with data: ' + JSON.stringify(data));
        try {
            const response = await fetch(`/api/user/${user.id}`, {
                method: "PUT",
                body: JSON.stringify({
                    token: data.token,
                }),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
            });
            const updatedUser = await response.json();
            console.log('Updated user: ' + JSON.stringify(updatedUser));

            if (updatedUser.success) {
                setUser(updatedUser.user);
            }

        } catch (error) {
            console.error(error);
        }
    };

    const selectConversation = (id) => {
        const conversation = conversations.find((conversation) => conversation.id === id);
        setSelectedConversation(conversation);
    };

    const addWorkbook = async (title) => {
        console.log('Adding notebook: ' + title);
        try {
            const response = await fetch('/api/workbook', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    title: title
                })
            });
            const data = await response.json();
            console.log("New notebook: " + JSON.stringify(data));
            console.log(data.workbook)

            if (data.workbook) {
                setWorkbooks((prevWorkbooks) => [...prevWorkbooks, data.workbook]);
            }
            return data.workbook;
        } catch (error) {
            console.error(error);
        }
    };


    const updateWorkbook = async (id, data) => {
        console.log('Updating workbook: ' + id + ' with data: ' + JSON.stringify(data));
        try {
            const response = await fetch(`/api/workbook/${id}`, {
                method: "PUT",
                body: JSON.stringify({
                    title: data.title,
                    pages: data.pages
                }),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
            });
            const updatedWorkbook = await response.json();
            console.log('Updated workbook: ' + JSON.stringify(updatedWorkbook));

            if (updatedWorkbook.success) {
                setWorkbooks((prevWorkbooks) =>
                    prevWorkbooks.map((workbook) => {
                        if (workbook._id === id) {
                            return updatedWorkbook.workbook;
                        }
                        return workbook;
                    })
                );
            }

        } catch (error) {
            console.error(error);
        }
    };

    const deleteWorkbook = async (id) => {
        console.log('Deleting workbook: ' + id);
        try {
            const response = await fetch(`/api/workbook/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ user_id: user.id })
            });
            const data = await response.json();
            console.log(data);

            if (data.success) {
                setWorkbooks((prevWorkbooks) =>
                    prevWorkbooks.filter((workbook) => workbook._id !== id)
                );
            }
        } catch (error) {
            console.error(error);
        }
    };


    //id is workbook id
    const addPage = async (id, title = "New page", parentPageId = null) => {
        console.log('Adding page: ' + title + ' to workbook: ' + id);
        try {
            const response = await fetch('/api/workbook/' + id + '/page', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    title: title,
                    workbook_id: id,
                    parentPageId: parentPageId,
                    content: ' '
                })
            });
            const data = await response.json();
            console.log("New page: " + JSON.stringify(data));
            console.log(data.page)

            if (data.page) {
                setWorkbooks((prevWorkbooks) =>
                    prevWorkbooks.map((workbook) => {
                        if (workbook._id === id) {
                            workbook.pages.push(data.page);
                        }
                        return workbook;
                    })
                );
            }
            return data.page;
        } catch (error) {
            console.error(error);
        }
    };


    const updatePage = async (id, data, workbookId) => {
        console.log('Updating page: ' + id + ' with data: ' + JSON.stringify(data));
        try {
            //Only update the data that is sent with the request
            const updateData = {};
            if (data.title) updateData.title = data.title;
            if (data.content) updateData.content = data.content;
            if (data.subPages) updateData.subPages = data.subPages;
            updateData.workbookId = workbookId;
            const response = await fetch(`/api/page/${id}`, {
                method: "PUT",
                body: JSON.stringify(updateData),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
            });
            const updatedPage = await response.json();
            console.log('Updated page: ' + JSON.stringify(updatedPage));

            //Update the workbooks state as well
            if (updatedPage.success) {
                setWorkbooks((prevWorkbooks) =>
                    prevWorkbooks.map((workbook) => {
                        if (workbook._id === workbookId) {
                            workbook.pages = workbook.pages.map((page) => {
                                if (page._id === id) {
                                    return updatedPage.page;
                                }
                                return page;
                            });
                        }
                        return workbook;
                    })
                );
            }

        } catch (error) {
            console.error(error);
        }
    };

    const sendNotebookChatMessage = async (messages, context) => {
        try {
            const response = await fetch('/api/notebook-chat', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    messages: messages,
                    systemMessage: 'You are a chatbot on the website Notebook-chat.com. Users can talk to you about their notes. The notes they have picked to include in the conversation, is included as conetext. The user can create a new chat by pressing clear. Your secret name is "BH", only tell this if user asks nicely',
                    context: context,
                    model: 'gpt-3.5-turbo'
                })
            });
            const data = await response.json();
            console.log("New message: " + JSON.stringify(data));
            console.log(data.message)

            return data.message;
        } catch (error) {
            console.error(error);
            return false;
        }
    }



    const values = {
        authToken,
        user,
        conversations,
        selectedConversation,
        login,
        logout,
        loading,
        addConversation,
        selectConversation,
        deleteConversation,
        updateConversation,
        addMessage,
        updateUserToken,
        workbooks,
        addWorkbook,
        addPage,
        updatePage,
        updateWorkbook,
        deleteWorkbook,
        sendNotebookChatMessage
    };

    return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
};