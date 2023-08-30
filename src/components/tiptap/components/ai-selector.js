import { getUrlFromString } from "/utils/misc"
import { Check, Trash } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useCompletion } from 'ai/react'

export const AISelector = ({ editor, isOpen, setIsOpen }) => {

    const [showResults, setShowResults] = useState(false)
    const [command, setCommand] = useState(null)

    const { completion, complete, isLoading } = useCompletion({
        api: "/api/generate-custom"
    })

    const commands = [
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
                editor?.commands.insertContent(completion)
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
            }
        }
    ]


    return (
        <div className="relative">
            <button
                className="flex h-full items-center"
                onClick={() => {
                    setIsOpen(!isOpen)
                }}
            >
                <p className="text-base">🪄</p>
                <p>
                    AI
                </p>
            </button>
            {isOpen && (
                <div
                    className="bubble-menu-open"
                >
                    {
                        commands.map((command, index) => (
                            <button
                                key={index}
                                className="flex items-center w-full p-1 hover:bg-stone-100"
                                onClick={() => {
                                    command.command()
                                    setIsOpen(false)
                                }}
                            >
                                <p className="text-base">{command.name}</p>
                            </button>
                        ))
                    }
                </div>
            )}
            {
                !isOpen && showResults && (
                    <div className="result" onClick={(e) => e.preventDefault()}>
                        <span className="label">Your generated content</span>
                        <p className="completion">
                            {completion == "" ? "Loading..." : completion}
                        </p>
                        {
                            !isLoading && (
                                <div className="bottom">
                                    <button
                                        className="delete"
                                        onClick={() => {
                                            setShowResults(false)
                                        }}
                                    >
                                        <Trash />
                                        <p className="text-base">Cancel</p>
                                    </button>
                                    <button
                                        className="check"
                                        onClick={() => {
                                            setShowResults(false)
                                            editor?.chain().focus().run();
                                            if (command == "Expand") {
                                                commands[0].insertFunction(completion)
                                            } else if (command == "Summarize") {
                                                commands[1].insertFunction(completion)
                                            } else if (command == "Get feedback") {
                                                commands[2].insertFunction(completion)
                                            } else if (command == "Rewrite") {
                                                commands[3].insertFunction(completion)
                                            }
                                        }}
                                    >
                                        <Check />
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
