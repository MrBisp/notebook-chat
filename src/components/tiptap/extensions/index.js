import StarterKit from "@tiptap/starter-kit"
import HorizontalRule from "@tiptap/extension-horizontal-rule"
import TiptapLink from "@tiptap/extension-link"
import TiptapImage from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import TiptapUnderline from "@tiptap/extension-underline"
import TextStyle from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import TaskItem from "@tiptap/extension-task-item"
import TaskList from "@tiptap/extension-task-list"
import { Markdown } from "tiptap-markdown"
import Highlight from "@tiptap/extension-highlight"
import SlashCommand from "./slash-command"
import { InputRule } from "@tiptap/core"
import UploadImagesPlugin from "../plugins/upload-images";
import UpdatedImage from "./updated-image";

const CustomImage = TiptapImage.extend({
    addProseMirrorPlugins() {
        return [UploadImagesPlugin()];
    },
});

export const TiptapExtensions = [
    StarterKit.configure({
        bulletList: {
            HTMLAttributes: {
                class: "bulletlist"
            }
        },
        orderedList: {
            HTMLAttributes: {
                class: "orderedlist"
            }
        },
        listItem: {
            HTMLAttributes: {
                class: "listitem"
            }
        },
        blockquote: {
            HTMLAttributes: {
                class: "blockquote"
            }
        },
        codeBlock: {
            HTMLAttributes: {
                class:
                    "codeblock"
            }
        },
        code: {
            HTMLAttributes: {
                class:
                    "code",
                spellcheck: "false"
            }
        },
        image: {
            HTMLAttributes: {
                class: "image"
            }
        },
        horizontalRule: false,
        dropcursor: {
            color: "#000",
            width: 4
        },
        gapcursor: false
    }),
    // patch to fix horizontal rule bug: https://github.com/ueberdosis/tiptap/pull/3859#issuecomment-1536799740
    HorizontalRule.extend({
        addInputRules() {
            return [
                new InputRule({
                    find: /^(?:---|—-|___\s|\*\*\*\s)$/,
                    handler: ({ state, range }) => {
                        const attributes = {}

                        const { tr } = state
                        const start = range.from
                        let end = range.to

                        tr.insert(start - 1, this.type.create(attributes)).delete(
                            tr.mapping.map(start),
                            tr.mapping.map(end)
                        )
                    }
                })
            ]
        }
    }).configure({
        HTMLAttributes: {
            class: "mt-4 mb-6 border-t border-stone-300"
        }
    }),
    TiptapLink.configure({
        HTMLAttributes: {
            class:
                "text-stone-400 underline underline-offset-[3px] hover:text-stone-600 transition-colors cursor-pointer"
        }
    }),
    TiptapImage.configure({
        HTMLAttributes: {
            class: "image-updated",
        },
        allowBase64: true,
        inline: true,
    }),
    Placeholder.configure({
        placeholder: ({ node }) => {
            if (node.type.name === "heading") {
                return `Heading ${node.attrs.level}`
            }
            return "Press '/' for commands, or '+++' for AI autocomplete..."
        },
        includeChildren: true
    }),
    SlashCommand,
    TiptapUnderline,
    TextStyle,
    Color,
    Highlight.configure({
        multicolor: true
    }),
    TaskList.configure({
        HTMLAttributes: {
            class: "not-prose pl-2"
        }
    }),
    TaskItem.configure({
        HTMLAttributes: {
            class: "flex items-start my-4"
        },
        nested: true
    }),
    Markdown.configure({
        html: true,
        transformCopiedText: true
    })
]
