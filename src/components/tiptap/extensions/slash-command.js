import React, {
    useState,
    useEffect,
    useCallback,
    useRef,
    useLayoutEffect
} from "react"
import { Extension } from "@tiptap/core"
import Suggestion from "@tiptap/suggestion"
import { ReactRenderer } from "@tiptap/react"
import { useCompletion } from "ai/react"
import tippy from "tippy.js"
import {
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    MessageSquarePlus,
    Text,
    TextQuote,
    Image as ImageIcon,
    Code,
    CheckSquare
} from "lucide-react"
import LoadingCircle from "../icons/loading-circle"
import { toast } from "sonner"
import va from "@vercel/analytics"
import Magic from "../icons/magic"
import { getPrevText } from "/utils/misc"
import { startImageUpload } from "../plugins/upload-images"

const Command = Extension.create({
    name: "slash-command",
    addOptions() {
        return {
            suggestion: {
                char: "/",
                command: ({ editor, range, props }) => {
                    props.command({ editor, range })
                }
            }
        }
    },
    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion
            })
        ]
    }
})

const getSuggestionItems = ({ query }) => {
    return [
        {
            title: "Continue writing",
            description: "Use AI to expand your thoughts.",
            searchTerms: ["gpt"],
            icon: <Magic className="w-7" />
        },
        {
            title: "Text",
            description: "Just start typing with plain text.",
            searchTerms: ["p", "paragraph"],
            icon: <Text size={18} />,
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleNode("paragraph", "paragraph")
                    .run()
            }
        },
        {
            title: "To-do List",
            description: "Track tasks with a to-do list.",
            searchTerms: ["todo", "task", "list", "check", "checkbox"],
            icon: <CheckSquare size={18} />,
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleTaskList()
                    .run()
            }
        },
        {
            title: "Heading 1",
            description: "Big section heading.",
            searchTerms: ["title", "big", "large", "h1"],
            icon: <Heading1 size={18} />,
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setNode("heading", { level: 1 })
                    .run()
            }
        },
        {
            title: "Heading 2",
            description: "Medium section heading.",
            searchTerms: ["subtitle", "medium", "h2"],
            icon: <Heading2 size={18} />,
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setNode("heading", { level: 2 })
                    .run()
            }
        },
        {
            title: "Heading 3",
            description: "Small section heading.",
            searchTerms: ["subtitle", "small", "h3"],
            icon: <Heading3 size={18} />,
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setNode("heading", { level: 3 })
                    .run()
            }
        },
        {
            title: "Bullet List",
            description: "Create a simple bullet list.",
            searchTerms: ["unordered", "point", "ul"],
            icon: <List size={18} />,
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleBulletList()
                    .run()
            }
        },
        {
            title: "Numbered List",
            description: "Create a list with numbering.",
            searchTerms: ["ordered", "ol"],
            icon: <ListOrdered size={18} />,
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleOrderedList()
                    .run()
            }
        },
        {
            title: "Quote",
            description: "Capture a quote.",
            searchTerms: ["blockquote"],
            icon: <TextQuote size={18} />,
            command: ({ editor, range }) =>
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleNode("paragraph", "paragraph")
                    .toggleBlockquote()
                    .run()
        },
        {
            title: "Code",
            description: "Capture a code snippet.",
            searchTerms: ["codeblock"],
            icon: <Code size={18} />,
            command: ({ editor, range }) =>
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleCodeBlock()
                    .run()
        },
        {
            title: "Image",
            description: "Upload an image from your computer.",
            searchTerms: ["photo", "picture", "media"],
            icon: <ImageIcon size={18} />,
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .run()
                // upload image
                const input = document.createElement("input")
                input.type = "file"
                input.accept = "image/*"
                input.onchange = async () => {
                    if (input.files?.length) {
                        const file = input.files[0]
                        const pos = editor.view.state.selection.from
                        startImageUpload(file, editor.view, pos)
                    }
                }
                input.click()
            }
        }
    ].filter(item => {
        if (typeof query === "string" && query.length > 0) {
            const search = query.toLowerCase()
            return (
                item.title.toLowerCase().includes(search) ||
                item.description.toLowerCase().includes(search) ||
                (item.searchTerms &&
                    item.searchTerms.some(term => term.includes(search)))
            )
        }
        return true
    })
}

export const updateScrollView = (container, item) => {
    const containerHeight = container.offsetHeight
    const itemHeight = item ? item.offsetHeight : 0

    const top = item.offsetTop
    const bottom = top + itemHeight

    if (top < container.scrollTop) {
        container.scrollTop -= container.scrollTop - top + 5
    } else if (bottom > containerHeight + container.scrollTop) {
        container.scrollTop += bottom - containerHeight - container.scrollTop + 5
    }
}

const CommandList = ({ items, command, editor, range }) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const { complete, isLoading } = useCompletion({
        id: "novel",
        api: "/api/generate",
        onResponse: response => {
            if (response.status === 429) {
                toast.error("You have reached your request limit for the day.")
                va.track("Rate Limit Reached")
                return
            }
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .run()
        },
        onFinish: (_prompt, completion) => {
            // highlight the generated text
            editor.commands.setTextSelection({
                from: range.from,
                to: range.from + completion.length
            })
        },
        onError: () => {
            toast.error("Something went wrong.")
        }
    })

    const selectItem = useCallback(
        index => {
            const item = items[index]
            va.track("Slash Command Used", {
                command: item.title
            })
            if (item) {
                if (item.title === "Continue writing") {
                    complete(
                        getPrevText(editor, {
                            chars: 5000,
                            offset: 1
                        })
                    )
                } else {
                    command(item)
                }
            }
        },
        [complete, command, editor, items]
    )

    useEffect(() => {
        const navigationKeys = ["ArrowUp", "ArrowDown", "Enter"]
        const onKeyDown = e => {
            if (navigationKeys.includes(e.key)) {
                e.preventDefault()
                if (e.key === "ArrowUp") {
                    setSelectedIndex((selectedIndex + items.length - 1) % items.length)
                    return true
                }
                if (e.key === "ArrowDown") {
                    setSelectedIndex((selectedIndex + 1) % items.length)
                    return true
                }
                if (e.key === "Enter") {
                    selectItem(selectedIndex)
                    return true
                }
                return false
            }
        }
        document.addEventListener("keydown", onKeyDown)
        return () => {
            document.removeEventListener("keydown", onKeyDown)
        }
    }, [items, selectedIndex, setSelectedIndex, selectItem])

    useEffect(() => {
        setSelectedIndex(0)
    }, [items])

    const commandListContainer = useRef(null)

    useLayoutEffect(() => {
        const container = commandListContainer?.current

        const item = container?.children[selectedIndex]

        if (item && container) updateScrollView(container, item)
    }, [selectedIndex])

    return items.length > 0 ? (
        <div
            id="slash-command"
            ref={commandListContainer}
            className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-stone-200 bg-white px-1 py-2 shadow-md transition-all"
        >
            {items.map((item, index) => {
                return (
                    <button
                        className={`flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm text-stone-900 hover:bg-stone-100 ${index === selectedIndex ? "bg-stone-100 text-stone-900" : ""
                            }`}
                        key={index}
                        onClick={() => selectItem(index)}
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 bg-white">
                            {item.title === "Continue writing" && isLoading ? (
                                <LoadingCircle />
                            ) : (
                                item.icon
                            )}
                        </div>
                        <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-xs text-stone-500">{item.description}</p>
                        </div>
                    </button>
                )
            })}
        </div>
    ) : null
}

const renderItems = () => {
    let component = null
    let popup = null

    return {
        onStart: props => {
            component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor
            })

            // @ts-ignore
            popup = tippy("body", {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start"
            })
        },
        onUpdate: props => {
            component?.updateProps(props)

            popup &&
                popup[0].setProps({
                    getReferenceClientRect: props.clientRect
                })
        },
        onKeyDown: props => {
            if (props.event.key === "Escape") {
                popup?.[0].hide()

                return true
            }

            // @ts-ignore
            return component?.ref?.onKeyDown(props)
        },
        onExit: () => {
            popup?.[0].destroy()
            component?.destroy()
        }
    }
}

const SlashCommand = Command.configure({
    suggestion: {
        items: getSuggestionItems,
        render: renderItems
    }
})

export default SlashCommand
