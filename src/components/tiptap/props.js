import { startImageUpload } from "./plugins/upload-images"

export const TiptapEditorProps = {
    attributes: {
        class: ``
    },
    handleDOMEvents: {
        keydown: (_view, event) => {
            // prevent default event listeners from firing when slash command is active
            if (["ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
                const slashCommand = document.querySelector("#slash-command")
                if (slashCommand) {
                    return true
                }
            }
        }
    },
    handlePaste: (view, event) => {
        console.log("Pasting something!")

        //Handle images
        let items = event.clipboardData.items;

        let blob = null;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") === 0) {
                blob = items[i].getAsFile();
            }
        }

        if (blob !== null) {
            event.preventDefault();
            const file = blob;
            const pos = view.state.selection.from;
            startImageUpload(file, view, pos);
            return true;
        } else {

            //const pastedText = event.clipboardData.getData('text/html');
            //Get only text
            const pastedText = event.clipboardData.getData('text/plain');
            if (pastedText) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = pastedText;

                // Remove color styles
                const elementsWithStyle = tempDiv.querySelectorAll('[style]');

                const cleanedText = tempDiv.innerText;
                // Insert cleaned text into the editor
                // Depending on your tiptap setup, you might need a different method here
                // Adjust as needed based on your tiptap version and configuration
                view.dispatch(view.state.tr.insertText(cleanedText, view.state.selection.from, view.state.selection.to));
                event.preventDefault();
                return true;
            }
        }
        return false;

    },
    handleDrop: (view, event, _slice, moved) => {
        if (
            !moved &&
            event.dataTransfer &&
            event.dataTransfer.files &&
            event.dataTransfer.files[0]
        ) {
            event.preventDefault()
            const file = event.dataTransfer.files[0]
            const coordinates = view.posAtCoords({
                left: event.clientX,
                top: event.clientY
            })
            // here we deduct 1 from the pos or else the image will create an extra node
            startImageUpload(file, view, coordinates.pos - 1)
            return true
        }
        return false
    }
}
