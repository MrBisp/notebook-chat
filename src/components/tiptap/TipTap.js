import { useEffect, useRef, useContext } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import { TiptapEditorProps } from "./props"
import { TiptapExtensions } from "./extensions"
import { useCompletion } from "ai/react"
import { getPrevText } from "./editor"
import { AuthContext } from "@/context/AuthContext"

const Tiptap = ({ saveHandler, value, setEditor }) => {
    const { authToken, user, track } = useContext(AuthContext)

    useEffect(() => {
        if (!editor) return;
        editor.commands.setContent(value)
    }, [])

    const editor = useEditor({
        extensions: TiptapExtensions,
        editorProps: TiptapEditorProps,
        content: value,
        onUpdate: e => {
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
                        chars: 1000
                    })
                )
                track("Autofill", { page: page.title, notebook: workbookId, source: '+++' })
            }
        },
        onCreate: e => {
            setEditor(e.editor)
        },
        autofocus: "start"
    })

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
            <EditorContent editor={editor} />
        </div>
    );
}

export default Tiptap
