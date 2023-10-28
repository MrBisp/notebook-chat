// AuthContext.js

import { createContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [authToken, setAuthToken] = useState(null);
    const [user, setUser] = useState(null);
    const [workbooks, setWorkbooks] = useState([]);
    const [modalContent, setModalContent] = useState(null);

    const [loading, setLoading] = useState(true);
    const [userSet, setUserSet] = useState(false);

    const [pagesSharedWithUser, setPagesSharedWithUser] = useState([]);

    const [commands, setCommands] = useState([]);
    const [commandTitle, setCommandTitle] = useState('');
    const [showCommmands, setShowCommands] = useState(false);

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

    const getBrowser = () => {
        const userAgent = window.navigator.userAgent;
        const browsers = { chrome: /chrome/i, safari: /safari/i, firefox: /firefox/i, ie: /internet explorer/i };
        for (const key in browsers) {
            if (browsers[key].test(userAgent)) {
                return key;
            }
        }
    }

    const getDeviceType = () => {
        if (window.innerWidth < 768) {
            return 'Mobile';
        } else {
            return 'Desktop';
        }
    }


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

        if (storedAuthToken) {
            const fetchData = async () => {
                try {
                    const response = await fetch('/api/auth/user', {
                        headers: {
                            Authorization: `Bearer ${storedAuthToken}`,
                        },
                    });
                    const data = await response.json();

                    if (!data.user) {
                        return;
                    }

                    setUser(data.user);
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
        localStorage.removeItem('authToken');
        router.push('/login');
    };


    const updateUserToken = async () => {
        try {
            const response = await fetch('/api/auth/updateAuthToken', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });
            const data = await response.json();

            if (!data.authToken) {
                return false;
            }

            localStorage.setItem('authToken', data.authToken);
            setAuthToken(data.authToken);

            return true;
        } catch (error) {
            console.error(error);
        }
    };

    const addWorkbook = async (title) => {
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

            if (data.workbook) {
                setWorkbooks((prevWorkbooks) => [...prevWorkbooks, data.workbook]);

                //Update user token
                await updateUserToken();
            }
            return data.workbook;
        } catch (error) {
            console.error(error);
        }
    };


    const updateWorkbook = async (id, data) => {
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
        try {
            const response = await fetch(`/api/workbook/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ user_id: user.id })
            });
            const data = await response.json();

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
        try {
            console.log('/api/workbook/' + id + '/page')
            console.log(authToken)
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
        try {
            //Only update the data that is sent with the request
            const updateData = {};
            if (data.title) updateData.title = data.title;
            if (data.content) updateData.content = data.content;
            if (data.subPages) updateData.subPages = data.subPages;
            updateData.workbookId = workbookId ? workbookId : null;
            const response = await fetch(`/api/page/${id}`, {
                method: "PUT",
                body: JSON.stringify(updateData),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
            });
            const updatedPage = await response.json();

            //Update the workbooks state as well
            if (updatedPage.success) {
                if (!workbookId) return;
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

    const deletePage = async (id, workbookId) => {
        try {
            const response = await fetch(`/api/page/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    user_id: user.id,
                    workbookId: workbookId
                })
            });
            const data = await response.json();

            if (data.success) {
                //Remove the page from the workbooks state as well
                setWorkbooks((prevWorkbooks) =>
                    prevWorkbooks.map((workbook) => {
                        if (workbook._id === workbookId) {
                            workbook.pages = workbook.pages.filter((page) => page._id !== id);
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

            return data.message;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    const track = (eventName, eventProperties) => {

        const allProperties = {
            ...eventProperties,
            deviceType: getDeviceType(),
            browser: getBrowser(),
        }

        const url = '/api/track';
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                eventName: eventName,
                eventProperties: allProperties,
                distinctId: getMixpanelId()
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                //console.log('Success:', data);
            }
            )
            .catch((error) => {
                console.error('Error:', error);
            });
    }

    const getMixpanelId = () => {
        if (user) {
            return user.id;
        }

        //If the user is not logged in, let's check localstorage
        const mixpanelFromLocalStorage = localStorage.getItem('mixpanelId');

        if (mixpanelFromLocalStorage) {
            return mixpanelFromLocalStorage;
        }

        //If that doesn't exist either, let's generate a new one, and save it in localstorage
        const newMixpanelId = Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36);
        localStorage.setItem('mixpanelId', newMixpanelId);
        return newMixpanelId;
    }

    //Get pages shared with user
    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            try {
                const response = await fetch('/api/page/shared-with-user/', {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                });
                const data = await response.json();

                if (!data.pages) {
                    return;
                }

                setPagesSharedWithUser(data.pages);
            } catch (error) {
                console.error(error);
            }
        };
        fetchData();
    }, [user]);



    const values = {
        authToken,
        user,
        login,
        logout,
        loading,
        updateUserToken,
        workbooks,
        addWorkbook,
        addPage,
        updatePage,
        deletePage,
        updateWorkbook,
        deleteWorkbook,
        sendNotebookChatMessage,
        track,
        modalContent,
        setModalContent,
        pagesSharedWithUser,
        commands,
        setCommands,
        showCommmands,
        setShowCommands,
        commandTitle,
        setCommandTitle
    };

    return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
};