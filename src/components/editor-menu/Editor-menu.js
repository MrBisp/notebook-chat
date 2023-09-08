import { useState, useRef, useEffect } from 'react';
import { MdCode, MdFormatBold, MdFormatItalic, MdFormatStrikethrough, MdExpandMore, MdOutlineFormatUnderlined, MdDeleteOutline, MdCheck, MdFormatListNumbered, MdFormatListBulleted } from 'react-icons/md';
import { getUrlFromString } from "/utils/misc"
import { EditorState } from '@tiptap/pm/state'
import styles from './Editor-menu.module.css'
import { set } from 'mongoose';

const EditorMenu = ({ editor }) => {

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
            console.log($from.node().type.name === 'codeBlock')
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
            if (marks && marks.length > 0) {
                setBold(marks.some(mark => mark.type?.name === 'bold'));
                setItalic(marks.some(mark => mark.type?.name === 'italic'));
                setStrike(marks.some(mark => mark.type?.name === 'strike'));
                setUnderline(marks.some(mark => mark.type?.name === 'underline'));
            } else {
                setBold(false);
                setItalic(false);
                setStrike(false);
                setUnderline(false);
            }
        };

        // If there's a selection, check marks at the selection
        if (!empty) {
            const marksInSelection = [];
            state.doc.nodesBetween(from, to, node => {
                marksInSelection.push(...node.marks);
            });

            // Convert marks to a Set to remove duplicates
            const uniqueMarks = [...new Set(marksInSelection.map(mark => mark.type.name))];

            // Update the state based on marks
            updateMarksState(uniqueMarks);

            // Let's find the current text type
            const node = state.selection.$from.node();
            if (node) {
                const type = node.type.name;
                setTextType(type === 'paragraph' ? 'Paragraph' : type === 'codeBlock' ? 'Other' : `Heading ${node.attrs.level}`);
            }
        } else {
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


    return (
        <div className={styles.editorMenu}>
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
                <button onClick={() => {
                    editor?.chain().focus().run();
                    editor?.chain().toggleBold().run();
                }}
                    className={bold ? styles.active : ""}
                ><MdFormatBold /></button>

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
                            <form>
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
            {
                //TODO:
                // - Add AI 
                // - Add table insert and edit
            }

        </div>
    )
}

export default EditorMenu