import { BubbleMenu } from "@tiptap/react"
import { useState } from "react"
import {
    BoldIcon,
    ItalicIcon,
    UnderlineIcon,
    StrikethroughIcon,
    CodeIcon
} from "lucide-react"

import { NodeSelector } from "./node-selector"
import { ColorSelector } from "./color-selector"
import { LinkSelector } from "./link-selector"
import { AISelector } from "./ai-selector"

export const EditorBubbleMenu = props => {
    const items = [
        {
            name: "bold",
            isActive: () => props.editor.isActive("bold"),
            command: () =>
                props.editor
                    .chain()
                    .focus()
                    .toggleBold()
                    .run(),
            icon: BoldIcon
        },
        {
            name: "italic",
            isActive: () => props.editor.isActive("italic"),
            command: () =>
                props.editor
                    .chain()
                    .focus()
                    .toggleItalic()
                    .run(),
            icon: ItalicIcon
        },
        {
            name: "underline",
            isActive: () => props.editor.isActive("underline"),
            command: () =>
                props.editor
                    .chain()
                    .focus()
                    .toggleUnderline()
                    .run(),
            icon: UnderlineIcon
        },
        {
            name: "strike",
            isActive: () => props.editor.isActive("strike"),
            command: () =>
                props.editor
                    .chain()
                    .focus()
                    .toggleStrike()
                    .run(),
            icon: StrikethroughIcon
        },
        {
            name: "code",
            isActive: () => props.editor.isActive("code"),
            command: () =>
                props.editor
                    .chain()
                    .focus()
                    .toggleCode()
                    .run(),
            icon: CodeIcon
        }
    ]

    const bubbleMenuProps = {
        ...props,
        shouldShow: ({ editor }) => {
            // don't show if image is selected
            if (editor.isActive("image")) {
                return false
            }
            return editor.view.state.selection.content().size > 0
        },
        tippyOptions: {
            moveTransition: "transform 0.15s ease-out",
            onHidden: () => {
                setIsNodeSelectorOpen(false)
                setIsColorSelectorOpen(false)
                setIsLinkSelectorOpen(false)
            }
        }
    }

    const [isNodeSelectorOpen, setIsNodeSelectorOpen] = useState(false)
    const [isColorSelectorOpen, setIsColorSelectorOpen] = useState(false)
    const [isLinkSelectorOpen, setIsLinkSelectorOpen] = useState(false)
    const [isAISelectorOpen, setIsAISelectorOpen] = useState(false)

    return (
        <BubbleMenu
            {...bubbleMenuProps}
            className="bubblemenu"
        >
            <AISelector
                editor={props.editor}
                isOpen={isAISelectorOpen}
                setIsOpen={() => {
                    setIsAISelectorOpen(!isAISelectorOpen)
                    setIsColorSelectorOpen(false)
                    setIsNodeSelectorOpen(false)
                    setIsLinkSelectorOpen(false)
                }}
            />
            <NodeSelector
                editor={props.editor}
                isOpen={isNodeSelectorOpen}
                setIsOpen={() => {
                    setIsNodeSelectorOpen(!isNodeSelectorOpen)
                    setIsColorSelectorOpen(false)
                    setIsLinkSelectorOpen(false)
                    setIsAISelectorOpen(false)
                }}
            />
            <LinkSelector
                editor={props.editor}
                isOpen={isLinkSelectorOpen}
                setIsOpen={() => {
                    setIsLinkSelectorOpen(!isLinkSelectorOpen)
                    setIsColorSelectorOpen(false)
                    setIsNodeSelectorOpen(false)
                    setIsAISelectorOpen(false)
                }}
            />
            <div className="flex">
                {items.map((item, index) => (
                    <button
                        key={index}
                        onClick={item.command}
                        className="button"
                    >
                        <item.icon />
                    </button>
                ))}
            </div>
            <ColorSelector
                editor={props.editor}
                isOpen={isColorSelectorOpen}
                setIsOpen={() => {
                    setIsColorSelectorOpen(!isColorSelectorOpen)
                    setIsNodeSelectorOpen(false)
                    setIsLinkSelectorOpen(false)
                    setIsAISelectorOpen(false)
                }}
            />
        </BubbleMenu>
    )
}
