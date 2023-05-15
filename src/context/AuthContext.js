// AuthContext.js

import { createContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(null);
    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [loading, setLoading] = useState(true);

    const router = useRouter();

    //Get user data from server on page load
    useEffect(() => {
        const storedAuthToken = localStorage.getItem('authToken');
        //console.log('Stored auth token: ' + storedAuthToken)

        if (storedAuthToken) {
            setAuthToken(storedAuthToken);

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
                } catch (error) {
                    console.error(error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, []);


    const login = async (email, password) => {
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
            console.log(data.authToken)

            if (!data.authToken) {
                return false;
            }

            setAuthToken(data.authToken);
            localStorage.setItem('authToken', data.authToken);

            return true;
        } catch (error) {
            console.error(error);
        }
    };

    const logout = () => {
        setAuthToken(null);
        setUser(null);
        setConversations([]);
        setSelectedConversation(null);
        localStorage.removeItem('authToken');
    };

    const addConversation = async () => {
        try {
            const response = await fetch(`/api/conversations?user_id=${user.id}`, {
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
        updateUserToken
    };

    return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
};