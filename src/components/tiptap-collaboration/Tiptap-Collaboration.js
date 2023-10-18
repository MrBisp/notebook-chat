import React from "react";
import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import StarterKit from "@tiptap/starter-kit";
import { HocuspocusProvider } from "@hocuspocus/provider";

export default function App({ id }) {

    const [chapterId, setChapterId] = useState(id);
    const [provider, setProvider] = useState(null);

    useEffect(() => {
        if (!chapterId) {
            return;
        }

        const provider = new HocuspocusProvider({
            url: "ws://127.0.0.1:1234/",
            name: chapterId,
        });
        setProvider(provider);

        return () => {
            provider.disconnect();
        };
    }, [chapterId]);

    useEffect(() => {
        setChapterId(id);
    }, [id]);

    return (
        <>
            <h1>Test editor ({id}) ({chapterId})</h1>
            {
                provider && (
                    <Editor provider={provider} />
                )
            }
        </>
    );
}

export function Editor({ provider }) {
    const editorOne = useEditor({
        extensions: [
            StarterKit.configure({ history: false }),
            Collaboration.configure({
                document: provider.document
            }),
            CollaborationCursor.configure({
                provider: provider,
                user: {
                    color: '#BEBEBE',
                    name: "User 1"
                }
            })
        ]
    });


    return (
        <>
            {editorOne && (
                <>
                    <h1>Editor 1</h1>
                    <EditorContent editor={editorOne} />
                </>
            )}
        </>
    );
}