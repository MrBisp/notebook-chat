import axios from 'axios';
import { dot, norm } from 'mathjs';
import fs from 'fs';
import path from 'path';
import { Configuration, OpenAIApi } from "openai";


export default async function handler(req, res) {
    const { query } = req.body;

    const configuration = new Configuration({
        apiKey: req.body.token,
    });
    const openai = new OpenAIApi(configuration);

    let messages = req.body.messages;

    //Set first message
    //Make a new message and add it as the very first
    let newMessageObject = {
        content: "You will generate a very short name for this thread",
        role: 'system'
    }
    //Add the new message to the messages array as the very first
    messages.unshift(newMessageObject);

    //Add a new message to the end of the messages array
    messages.push({ content: "Generate a very short name for this thread. Only include the name of the thread.", role: 'user' });

    //Remove the id from the messages before sending them to the AI
    for (let i = 0; i < messages.length; i++) {
        delete messages[i]._id;
    }

    const response = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.5,
        max_tokens: 10,
    });
    console.log('Tokens consumed: ' + response.data.usage.total_tokens);
    console.log('Response: ' + response.data.choices[0].message.content);

    res.status(200).json({ message: response.data.choices[0].message.content });
}