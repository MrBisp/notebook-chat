import { getUrlFromString } from "/utils/misc"
import { Check, Trash } from "lucide-react"
import { useEffect, useRef } from "react"

export const LinkSelector = ({ editor, isOpen, setIsOpen }) => {
    const inputRef = useRef(null)

    // Autofocus on input by default
    useEffect(() => {
        inputRef.current && inputRef.current?.focus()
    })

    return (
        <div className="relative">
            <button
                className="flex h-full items-center space-x-2 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 active:bg-stone-200"
                onClick={() => {
                    setIsOpen(!isOpen)
                }}
            >
                <p className="text-base">↗</p>
                <p>
                    Link
                </p>
            </button>
            {isOpen && (
                <form
                    onSubmit={e => {
                        e.preventDefault()
                        const input = e.target[0]
                        const url = getUrlFromString(input.value)
                        url &&
                            editor
                                .chain()
                                .focus()
                                .setLink({ href: url })
                                .run()
                        setIsOpen(false)
                    }}
                    className="fixed top-full z-[99999] mt-1 flex w-60 overflow-hidden rounded border border-stone-200 bg-white p-1 shadow-xl animate-in fade-in slide-in-from-top-1"
                >
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Paste a link"
                        className="flex-1 bg-white p-1 text-sm outline-none"
                        defaultValue={editor.getAttributes("link").href || ""}
                    />
                    {editor.getAttributes("link").href ? (
                        <button
                            className="flex items-center rounded-sm p-1 text-red-600 transition-all hover:bg-red-100 dark:hover:bg-red-800"
                            onClick={() => {
                                editor
                                    .chain()
                                    .focus()
                                    .unsetLink()
                                    .run()
                                setIsOpen(false)
                            }}
                        >
                            <Trash className="h-4 w-4" />
                        </button>
                    ) : (
                        <button className="flex items-center rounded-sm p-1 text-stone-600 transition-all hover:bg-stone-100">
                            <Check className="h-4 w-4" />
                        </button>
                    )}
                </form>
            )}
        </div>
    )
}
