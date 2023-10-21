import { useState, useRef, useEffect, useContext, Fragment } from 'react';
import { MdCode, MdFormatBold, MdFormatItalic, MdFormatStrikethrough, MdExpandMore, MdOutlineFormatUnderlined, MdDeleteOutline, MdCheck, MdFormatListNumbered, MdFormatListBulleted, MdOutlineDelete } from 'react-icons/md';
import { getUrlFromString } from "/utils/misc"
import { useCompletion } from 'ai/react'
import styles from './Editor-menu.module.css'
import { AuthContext } from '@/context/AuthContext';

const EditorMenu = ({ editor, accessLevel, page }) => {

    const { authToken, user, track, setModalContent } = useContext(AuthContext)

    const inputRef = useRef(null)

    const [bold, setBold] = useState(false);
    const [italic, setItalic] = useState(false);
    const [strike, setStrike] = useState(false);
    const [underline, setUnderline] = useState(false);
    const [code, setCode] = useState(false);
    const [ul, setUl] = useState(false);
    const [ol, setOl] = useState(false);

    const [showLink, setShowLink] = useState(false);
    const [showTable, setShowTable] = useState(false);
    const [showHeading, setShowHeading] = useState(false);
    const [showAI, setShowAI] = useState(false);

    const headings = [1, 2, 3, 4, 5, 6];
    const [textType, setTextType] = useState("Paragraph");

    const { completion, complete, isLoading } = useCompletion({
        api: "/api/generate-custom",
        onFinish: (_prompt, completion) => {
            const order = fetch('/api/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    tokens: -1,
                    type: 'editormenu',
                    userid: user._id
                })
            })

            track("Generated content (editormenu)", {
                completion: completion,
                prompt: _prompt
            });
        }
    })
    const [showResults, setShowResults] = useState(false)
    const [command, setCommand] = useState(null)
    const [highlightingText, setHighlightingText] = useState(false)

    const showShareScreen = async () => {
        console.log("Showing share screen")
        const url = '/api/invitation'
        const body = {
            pageId: page._id,
            expiration: new Date(Date.now() + 24 * 60 * 60 * 1000 * 7)
        }
        const headers = {
            'Content-Type': 'application/json',
            'authorization': `Bearer ${authToken}`
        }
        const request = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        })
        const response = await request.json()
        console.log(response)
        const link = response.link;

        const html = <Fragment>
            <div className='modal-content-inner'>
                <h3>Share note</h3>
                <p>Share this note with others by sending them the link below.</p>
                <div className='link-container'>
                    <input type="text" value={link} disabled />
                    <button onClick={() => {
                        navigator.clipboard.writeText(link)
                        document.getElementById("linkCopiedText").innerHTML = "Copied!"

                    }}>Copy</button>
                </div>
                <div id="linkCopiedText"></div>
            </div>
        </Fragment>

        setModalContent(html)
    }

    useEffect(() => {
        if (!showLink) return;
        inputRef.current && inputRef.current?.focus()
    }, [showLink])

    const setLink = (url) => {
        editor.chain().focus().setLink({ href: url }).run()
        setShowLink(false)
    }

    const updateStateFromEditor = () => {
        const { state } = editor.view;
        const { empty, from, to } = state.selection;

        // Function to check if the cursor is inside a list item
        const isCursorInListItem = () => {
            const { $from } = state.selection;
            let result = false;
            // Find the nearest ancestor node that is a list item (li)
            let listItem = $from.node($node => $node.type.name === 'listItem');
            result = !!listItem;

            if (!listItem) {
                // If the cursor is not directly inside a list item, traverse up the document tree
                // to find the nearest list item
                for (let depth = $from.depth; depth >= 0; depth--) {
                    const node = $from.node(depth);
                    if (node.type.name === 'listItem') {
                        listItem = $from.node(depth - 1);
                        result = true;
                        break;
                    }
                }
            }

            return result ? listItem?.type.name === 'bulletList' ? 'ul' : 'ol' : false;
        };

        const isCursorInCodeBlock = () => {
            const { $from } = state.selection;
            return $from.node().type.name === 'codeBlock';
        };

        // Call the function to check if the cursor is inside a list item
        const listType = isCursorInListItem();
        const inCodeBlock = isCursorInCodeBlock();
        setUl(listType === 'ul');
        setOl(listType === 'ol');
        setCode(inCodeBlock);

        // Function to update state based on marks
        const updateMarksState = (marks) => {
            const bold = marks.some(mark => mark.type?.name === 'bold');
            const italic = marks.some(mark => mark.type?.name === 'italic');
            const strike = marks.some(mark => mark.type?.name === 'strike');
            const underline = marks.some(mark => mark.type?.name === 'underline');

            setBold(bold);
            setItalic(italic);
            setStrike(strike);
            setUnderline(underline);
        };

        // If there's a selection, check marks at the selection
        if (!empty) {
            setHighlightingText(true)
            const marksInSelection = [];
            state.doc.nodesBetween(from, to, node => {
                marksInSelection.push(...node.marks);
            });

            // Convert marks to a Set to remove duplicates
            const uniqueMarks = [...new Set(marksInSelection)];

            // Update the state based on marks
            updateMarksState(uniqueMarks);

            // Let's find the current text type
            const node = state.selection.$from.node();
            if (node) {
                const type = node.type.name;
                setTextType(type === 'paragraph' ? 'Paragraph' : type === 'codeBlock' ? 'Other' : `Heading ${node.attrs.level}`);
            }
        } else {
            setHighlightingText(false)
            // If there's no selection, check marks at the cursor position
            const marks = state.selection.$cursor.marks();
            // Update the state based on marks
            updateMarksState(marks);

            // Let's find the current text type
            const node = state.selection.$from.node();
            if (node) {
                const type = node.type.name;
                setTextType(type === 'paragraph' ? 'Paragraph' : type === 'codeBlock' ? 'Other' : `Heading ${node.attrs.level}`);
            }
        }
    };


    useEffect(() => {
        if (!editor) return;

        // Attach the update function to the editor's state change event
        editor.on('transaction', updateStateFromEditor);
        editor.on('update', updateStateFromEditor);

        // Call the update function once to initialize the state
        updateStateFromEditor();

        // Clean up the event listener when the component unmounts
        return () => {
            editor.off('transaction', updateStateFromEditor);
            editor.off('update', updateStateFromEditor);
        };
    }, [editor]);

    const AICommands = [
        {
            name: "Expand",
            command: () => {
                //First get the selected text (promsemirror)
                let selectedText = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)

                //Then get the text before the selected text
                const preLength = 300;
                let prevText = editor.state.doc.textBetween(Math.max(0, editor.state.selection.from - preLength), editor.state.selection.from)

                //Then send it to the API
                let prompt = "Expand the following text: " + selectedText
                prompt += "\n\n" + "The text leading up to it was: " + prevText
                complete(prompt)
                setShowResults(true)
                setCommand("Expand")
            },
            insertFunction: (completion) => {
                console.log("Inserting expansion")
                editor?.chain().focus().run();
                editor?.commands.insertContent(completion);
                setShowResults(false)
                setShowAI(false)
            }
        },
        {
            name: "Summarize",
            command: () => {
                //TODO: Summarize
                //First get the selected text (promsemirror)
                let selectedText = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)

                let prompt = "Summarize the following text: " + selectedText
                complete(prompt)
                setShowResults(true)
                setCommand("Summarize")
            },
            insertFunction: (completion) => {
                console.log("Inserting summary")
                //Insert the summary after the selected text
                editor?.chain().focus().run();
                editor?.commands.insertContentAt(editor.state.selection.to, "\n\n" + completion)
                setShowResults(false)
                setShowAI(false)
            }
        },
        {
            name: "Get feedback",
            command: () => {
                //TODO: Get feedback
                //First get the selected text (promsemirror)
                let selectedText = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)

                let prompt = "Give quality feedback on the following text: " + selectedText
                complete(prompt)
                setShowResults(true)
                setCommand("Get feedback")
            },
            insertFunction: (completion) => {
                console.log("Inserting feedback")
                //Insert the feedback after the selected text
                editor?.chain().focus().run();
                editor?.commands.insertContentAt(editor.state.selection.to, "\n\n" + completion)
                setShowResults(false)
                setShowAI(false)
            }
        },
        {
            name: "Rewrite",
            command: () => {
                let selectedText = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)
                let prompt = "Rewrite the following text: " + selectedText
                complete(prompt)
                setShowResults(true)
                setCommand("Rewrite")
            },
            insertFunction: (completion) => {
                console.log("Inserting rewrite")
                //Insert the feedback after the selected text
                editor?.chain().focus().run();
                editor?.commands.insertContent(completion)
                setShowResults(false)
                setShowAI(false)
            }
        }
    ]

    //Hide the AI menu when the user is highlighting text
    useEffect(() => {
        if (!highlightingText)
            setShowAI(false)
    }, [highlightingText])

    return (
        <>
            <div className={styles.editorMenu}>
                <div className={styles.tools}>
                    <div className={styles.scroll}>
                        {
                            highlightingText && (
                                <div className={styles.expandable} onClick={() => {
                                    setShowAI(!showAI)
                                    setShowHeading(false)
                                    setShowLink(false)
                                    setShowTable(false)
                                }}>
                                    <button>AI 🪄 <MdExpandMore /></button>
                                    {showAI && (
                                        <>
                                            <div className={styles.submenu}>
                                                {AICommands.map((command, i) => (
                                                    <button key={i}
                                                        onClick={() => {
                                                            command.command()
                                                        }}
                                                        className="sub-button"
                                                    >
                                                        {command.name}
                                                    </button>
                                                ))}

                                            </div>
                                        </>
                                    )}
                                    {
                                        showResults && (
                                            <div className={styles.result} onClick={(e) => e.preventDefault()}>
                                                <span className={styles.label}>Your generated content</span>
                                                <p className={styles.completion}>
                                                    {completion == "" ? "Loading..." : completion}
                                                </p>
                                                {
                                                    !isLoading && (
                                                        <div className={styles.bottom}>
                                                            <button
                                                                className={styles.delete}
                                                                onClick={() => {
                                                                    setShowResults(false)
                                                                }}
                                                            >
                                                                <MdOutlineDelete />
                                                                <p className={styles.cancel}>Cancel</p>
                                                            </button>
                                                            <button
                                                                className={styles.check}
                                                                onClick={() => {
                                                                    setShowResults(false)
                                                                    editor?.chain().focus().run();
                                                                    if (command == "Expand") {
                                                                        AICommands[0].insertFunction(completion)
                                                                    } else if (command == "Summarize") {
                                                                        AICommands[1].insertFunction(completion)
                                                                    } else if (command == "Get feedback") {
                                                                        AICommands[2].insertFunction(completion)
                                                                    } else if (command == "Rewrite") {
                                                                        AICommands[3].insertFunction(completion)
                                                                    }
                                                                }}
                                                            >
                                                                <MdCheck />
                                                                <p className="text-base">Insert</p>
                                                            </button>
                                                        </div>
                                                    )
                                                }
                                            </div>
                                        )
                                    }
                                </div>
                            )
                        }


                        <div className={styles.expandable} onClick={() => {
                            setShowHeading(!showHeading)
                            setShowAI(false)
                            setShowLink(false)
                            setShowTable(false)
                        }}>
                            <button>{textType} <MdExpandMore /></button>
                            {showHeading && (
                                <>
                                    <div className={styles.submenu}>
                                        <button key="text"
                                            onClick={() => {
                                                editor?.chain().focus().toggleNode("paragraph", "paragraph").run();
                                                setTextType("paragraph")
                                            }}
                                            className={textType == 'Paragraph' ? styles.active : "sub-button"}
                                        >Normal text</button>
                                        {headings.map((heading, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    editor?.chain().focus().toggleHeading({ level: heading }).run();
                                                    setTextType(`Heading ${heading}`)
                                                }}
                                                className={textType == 'Heading ' + heading ? styles.active : "sub-button"}
                                            >
                                                Heading {heading}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className={styles.button_group}>
                            <button
                                onClick={() => {
                                    editor?.chain().focus().run();
                                    editor?.chain().toggleBold().run();
                                }}
                            >
                                <MdFormatBold />
                            </button>
                            <button onClick={() => {
                                editor?.chain().focus().run();
                                editor?.chain().toggleItalic().run();
                            }}
                                className={italic ? styles.active : ""}
                            ><MdFormatItalic /></button>

                            <button onClick={() => {
                                editor?.chain().focus().run();
                                editor?.chain().toggleStrike().run();
                            }}
                                className={strike ? styles.active : ""}
                            ><MdFormatStrikethrough /></button>

                            <button onClick={() => {
                                editor?.chain().focus().run();
                                editor?.chain().toggleUnderline().run();
                            }}
                                className={underline ? styles.active : ""}
                            ><MdOutlineFormatUnderlined /></button>
                        </div>

                        <div className={styles.button_group}>
                            <button onClick={() => {
                                editor?.chain().focus().run();
                                editor?.chain().toggleBulletList().run();
                            }}
                                className={ul ? styles.active : ""}
                            ><MdFormatListBulleted /></button>
                            <button onClick={() => {
                                editor?.chain().focus().run();
                                editor?.chain().toggleOrderedList().run();
                            }}
                                className={ol ? styles.active : ""}
                            ><MdFormatListNumbered /></button>
                        </div>

                        <div className={styles.button_group}>
                            <button onClick={() => {
                                editor?.chain().focus().run();
                                editor?.chain().toggleCodeBlock().run();
                            }}
                                className={code ? styles.active : ""}
                            ><MdCode /> </button>
                        </div>


                        <div className={styles.expandable} onClick={() => setShowLink(!showLink)}>
                            <button>Link <MdExpandMore /></button>
                            {
                                showLink &&
                                <>
                                    <div className={styles.submenu}>
                                        <form className={styles.link}>
                                            <input type="text" placeholder="Paste a link" defaultValue={editor.getAttributes("link").href || ""} onClick={e => e.stopPropagation()} ref={inputRef} />
                                            {editor.getAttributes("link").href ? (
                                                <button
                                                    onClick={() => {
                                                        editor.chain().focus().unsetLink().run()
                                                        setShowLink(false)
                                                    }}
                                                ><MdDeleteOutline /></button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        const url = getUrlFromString(inputRef.current.value)
                                                        url && setLink(url)
                                                    }}
                                                ><MdCheck /></button>
                                            )}
                                        </form>
                                    </div>
                                </>
                            }
                        </div>
                    </div>
                </div>
                {
                    showLink &&
                    <>
                        <div className={styles.submenu}>
                            <form className={styles.link}>
                                <input type="text" placeholder="Paste a link" defaultValue={editor.getAttributes("link").href || ""} onClick={e => e.stopPropagation()} ref={inputRef} />
                                {editor.getAttributes("link").href ? (
                                    <button
                                        onClick={() => {
                                            editor.chain().focus().unsetLink().run()
                                            setShowLink(false)
                                        }}
                                    ><MdDeleteOutline /></button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            const url = getUrlFromString(inputRef.current.value)
                                            url && setLink(url)
                                        }}
                                    ><MdCheck /></button>
                                )}
                            </form>
                        </div>
                    </>
                }
            </div>
        </>
    )
}

export default EditorMenu