import axios from 'axios';
import { dot, norm } from 'mathjs';
import fs from 'fs';
import path from 'path';
import { Configuration, OpenAIApi } from "openai";


export default async function handler(req, res) {
    const { query } = req.body;

    console.log('--- New message (existing thread) ---')

    const configuration = new Configuration({
        apiKey: req.body.token,
    });
    const openai = new OpenAIApi(configuration);

    let messages = req.body.messages;
    let newMessage = req.body.newMessage;

    //Set first message
    //Make a new message and add it as the very first
    let newMessageObject = {
        content: req.body.systemMessage,
        role: 'system'
    }
    //Add the new message to the messages array as the very first
    messages.unshift(newMessageObject);

    //Let's make sure that the messages are not too long
    let messagesLength = messages[messages.length - 1].content.length;
    let maxLength = 3000;

    for (let i = 0; i < messages.length; i++) {
        if (messagesLength > maxLength) {
            messages.splice(i, messages.length - i);
            //Now add the very last message again
            messages.push({ content: newMessage, role: 'user' });
            console.log('Messages: ' + JSON.stringify(messages));
            messages[messages.length - 1].content += context;
            break;
        }
        messagesLength += messages[i].content.length;
        messagesLength += messages[i].role.length;
    }

    console.log('Final messages: ' + JSON.stringify(messages));

    console.log(req.body.model)
    console.log(messages)

    //Remove the id from the messages before sending them to the AI
    for (let i = 0; i < messages.length; i++) {
        delete messages[i]._id;
    }

    const response = await openai.createChatCompletion({
        model: req.body.model,
        messages: messages,
        temperature: 0.5,
        max_tokens: 1024,
    });
    console.log('Tokens consumed: ' + response.data.usage.total_tokens);
    console.log('Response: ' + response.data.choices[0].message.content);

    res.status(200).json({ message: response.data.choices[0].message.content });
}