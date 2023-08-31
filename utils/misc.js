export function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

export function getUrlFromString(str) {
    if (isValidUrl(str)) return str;
    try {
        if (str.includes(".") && !str.includes(" ")) {
            return new URL(`https://${str}`).toString();
        }
    } catch (e) {
        return null;
    }
}

export const getPrevText = (
    editor,
    {
        chars,
        offset = 0,
    },
) => {
    // for now, we're using textBetween for now until we can figure out a way to stream markdown text
    // with proper formatting: https://github.com/steven-tey/novel/discussions/7
    return editor.state.doc.textBetween(
        Math.max(0, editor.state.selection.from - chars),
        editor.state.selection.from - offset,
        "\n",
    );
    // complete(editor.storage.markdown.getMarkdown());
};
