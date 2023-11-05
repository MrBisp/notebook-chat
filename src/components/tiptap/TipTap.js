import { useEffect, useRef, useContext, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import { TiptapEditorProps } from "./props"
import { TiptapExtensions } from "./extensions"
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { useCompletion } from "ai/react"
import { getPrevText } from "./editor"
import { AuthContext } from "@/context/AuthContext"
import { ImageResizer } from "./components/image-resizer";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { generateJSON } from '@tiptap/html'

const Tiptap = ({ saveHandler, value, setEditor, pageId }) => {
    const { authToken, user, track } = useContext(AuthContext)

    const [provider, setProvider] = useState(null);
    const [allExtensions, setAllExtensions] = useState(null);

    const [json, setJson] = useState(null);
    const startValue = value;

    useEffect(() => {
        if (!value) return;
        if (json) return;

        let jsonValue = generateJSON(value, [
            ...TiptapExtensions,
        ]);
        setJson(jsonValue);
    }, [value]);

    useEffect(() => {
        if (!pageId) return;
        if (!json) return;
        if (!authToken) return;


        const provider = new HocuspocusProvider({
            url: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
            name: pageId,
            token: authToken,
            parameters: {
                API_URL: process.env.NEXT_PUBLIC_API_URL,
                page: pageId,
            }
        });
        setProvider(provider);



        return () => {
            provider.disconnect();
        }
    }, [pageId, json]);

    useEffect(() => {
        if (provider && user && user.email) {
            setAllExtensions(TiptapExtensions.concat([
                Collaboration.configure({ document: provider.document }),
                CollaborationCursor.configure({
                    provider: provider,
                    user: {
                        color: '#F1CA5C',
                        name: user.email,
                    },
                }),
            ]));
        }
    }, [provider, user]);

    return (
        <>
            {
                provider && allExtensions && (
                    <EditorEditor
                        provider={provider}
                        saveHandler={saveHandler}
                        value={value}
                        setEditor={setEditor}
                        pageId={pageId}
                        allExtensions={allExtensions}
                        track={track}
                        authToken={authToken}
                        user={user}
                        startValue={startValue}
                    />
                )
            }
        </>
    )


}

function EditorEditor({ provider, saveHandler, value, setEditor, pageId, allExtensions, track, authToken, user, startValue }) {

    const hasInsertedStarterHTML = useRef(false);

    const editor = useEditor({
        extensions: allExtensions,
        editorProps: TiptapEditorProps,
        onCreate: e => {
            setEditor(e.editor);
        },
        onUpdate: e => {
            if (!hasInsertedStarterHTML.current) return;
            saveHandler(e.editor.getHTML());
            const selection = e.editor.state.selection
            const lastTwo = getPrevText(e.editor, {
                chars: 3
            })
            if (lastTwo === "+++" && !isLoading) {
                e.editor.commands.deleteRange({
                    from: selection.from - 3,
                    to: selection.from
                })
                complete(
                    getPrevText(e.editor, {
                        chars: 500
                    })
                )
                track("Autofill", { source: '+++' })
            }
        },
        autofocus: "start"
    });


    const { complete, completion, isLoading, stop } = useCompletion({
        id: "novel",
        api: "/api/generate",
        onFinish: (_prompt, completion) => {
            editor?.commands.setTextSelection({
                from: editor.state.selection.from - completion.length,
                to: editor.state.selection.from
            })

            const order = fetch('/api/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    tokens: -1,
                    type: 'autofill',
                    userid: user._id
                })
            })

        },
        onError: err => {
            alert("Errror. Check console for more")
            console.error(err)
            if (err.message === "You have reached your request limit for the day.") {
                //va.track("Rate Limit Reached")
            }
        }
    })

    const prev = useRef("")

    provider.on("synced", (state) => {
        const currentContent = editor?.getHTML();
        if (!currentContent) return;

        hasInsertedStarterHTML.current = true;

        // If the current content is empty, and it is not what we would expect (meaning that no one is in the room), insert the start value
        if (currentContent === '<p></p>' && currentContent !== startValue) {
            editor?.commands.insertContent(startValue)
        }
    });

    // Insert chunks of the generated text
    useEffect(() => {
        const diff = completion.slice(prev.current.length)
        prev.current = completion
        editor?.commands.insertContent(diff)
    }, [isLoading, editor, completion])

    useEffect(() => {
        // if user presses escape or cmd + z and it's loading,
        // stop the request, delete the completion, and insert back the "+++"
        const onKeyDown = e => {
            if (e.key === "Escape" || (e.metaKey && e.key === "z")) {
                stop()
                if (e.key === "Escape") {
                    editor?.commands.deleteRange({
                        from: editor.state.selection.from - completion.length,
                        to: editor.state.selection.from
                    })
                }
                editor?.commands.insertContent("+++")
            }
        }
        const mousedownHandler = e => {
            e.preventDefault()
            e.stopPropagation()
            stop()
            if (window.confirm("AI writing paused. Continue?")) {
                complete(editor?.getText() || "")
            }
        }
        if (isLoading) {
            document.addEventListener("keydown", onKeyDown)
            window.addEventListener("mousedown", mousedownHandler)
        } else {
            document.removeEventListener("keydown", onKeyDown)
            window.removeEventListener("mousedown", mousedownHandler)
        }
        return () => {
            document.removeEventListener("keydown", onKeyDown)
            window.removeEventListener("mousedown", mousedownHandler)
        }
    }, [stop, isLoading, editor, complete, completion.length])

    return (
        <div
            onClick={() => {
                editor?.chain().focus().run();
            }}
            className="editor"
        >
            {editor?.isActive("image") && <ImageResizer editor={editor} />}
            <EditorContent editor={editor} />
        </div>
    );

}

export default Tiptap