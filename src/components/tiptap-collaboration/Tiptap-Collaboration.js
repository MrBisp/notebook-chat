import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { WebrtcProvider } from "y-webrtc";
import * as Y from "yjs";
import StarterKit from "@tiptap/starter-kit";

const chapterId = "123456123123aaaa";
const ydoc = new Y.Doc();
const provider = new WebrtcProvider(chapterId, ydoc);

export default function App() {
    return (
        <>
            <h1>Test editor</h1>
            <Editor ydoc={ydoc} />
        </>
    );
}

export function Editor({ ydoc }) {
    const editorOne = useEditor({
        extensions: [
            StarterKit.configure({ history: false }),
            Collaboration.configure({
                document: ydoc
            }),
            CollaborationCursor.configure({
                provider: provider,
                user: {
                    name: 'Cyndi Lauper',
                    color: '#f783ac',
                },
            }),
        ],
        content: `
        <p>
          Annotations can be used to add additional information to the content, for example comments. They live on a different level than the actual editor content.
        </p>
        <p>
          This example allows you to add plain text, but you’re free to add more complex data, for example JSON from another tiptap instance. :-)
        </p>
      `
    });


    return (
        <>
            {editorOne && (
                <>
                    <h1>Editor 1</h1>
                    <EditorContent className="editor-content" editor={editorOne} />
                </>
            )}
        </>
    );
}
