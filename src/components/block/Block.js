import React, { useState, useEffect, useContext, useRef } from 'react';
import styles from './Block.module.css';
import { AuthContext } from '../../context/AuthContext';
import { set } from 'mongoose';


const Block = ({ block = null, workbook, page, blockIndex = -1, focus, setFocus, position = 0 }) => {

    const { addBlock, updateBlock } = useContext(AuthContext);

    const [content, setContent] = useState('');
    const [type, setType] = useState('');
    const [blockId, setBlockId] = useState('');

    const isNewBlockRef = useRef(false);

    const [isLoading, setIsLoading] = useState(false);

    function setChangeListener(div, listener) {
        div.addEventListener("paste", listener);
        div.addEventListener("cut", listener);
        div.addEventListener("input", listener);
    }

    //Set the block's content and type
    useEffect(() => {
        if (block) {
            setContent(block.content);
            setType(block.type);
            setBlockId(block._id);
        }
        if (block == null) {
            setBlockId('new-block');
            isNewBlockRef.current = true;
        }
    }, [block]);

    useEffect(() => {

        const runFocus = async () => {
            console.log("Setting focus to block: ", blockId)
            console.log("Setting focus to position: ", position)
            const div = document.querySelector(`[data-block-id="${blockId}"]`);
            if (div) {
                div.focus();

                console.log('Length of content: ', content.length)
                let start = 1;
                content.length == 0 ? start = 0 : start = 1;
                const range = document.createRange();
                const sel = window.getSelection();
                range.setStart(div, start);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);

                //Set the focus
                focus = null;
            }
        }

        //Set focus
        if (focus && content || focus && content === '') {
            runFocus();
        }
    }, [focus, content]);

    //Set the change listener when the block is rendered
    useEffect(() => {
        if (blockId) {
            const div = document.querySelector(`[data-block-id="${blockId}"]`);
            if (div) {
                setChangeListener(div, changeHandler);
            }
        }
    }, [blockId]);

    const changeHandler = async (e) => {
        if (isLoading) return;
        const element = e.target;

        if (content.length == element.textContent.length) {
            // If a paste operation has occurred, wait before accessing the content
            await new Promise((resolve) => setTimeout(resolve, 10));
        }

        setContent(element.textContent);

        //If it is a new block, add it to the database
        if (isNewBlockRef.current) {
            isNewBlockRef.current = false;
            setIsLoading(true);
            let newBlock = await addBlock(workbook._id, page._id, 'text', element.textContent, blockIndex);

            //Since the block is added to the database, this block should actually become a new block, while the current block is reborn as a new block
            setContent('')
            setBlockId('new-block');
            isNewBlockRef.current = true;
            setType('text')

            //Get current cursor position in the div
            const selection = window.getSelection();
            const cursorPosition = selection.focusOffset;
            console.log("Cursor Position: ", cursorPosition)

            //Set focus on the new block
            setFocus(newBlock._id, cursorPosition + element.textContent.length);

            //Remove focus from the current block
            let div = document.querySelector(`[data-block-id=new-block]`);
            if (div) {
                div.blur();
            }
        }

        //Update the block in the database
        else {
            console.log('update block')
            //updateBlock(workbook._id, page._id, blockId, type, element.textContent);
        }
    }


    return (
        <>
            {
                block && block.type === 'text' && (
                    <div className='block block-text' data-block-id={blockId} contentEditable="true" spellCheck="true" placeholder="Start typing...">
                        {block.content}
                    </div>
                )
            }
            {
                !block && (
                    <div id="new-block" className="block block-text" data-block-id={blockId} contentEditable="true" spellCheck="true" placeholder="Start typing...">
                        {content}
                    </div>
                )
            }
        </>
    )
}

export default Block;