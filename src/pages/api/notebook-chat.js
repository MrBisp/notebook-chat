import axios from 'axios';
import { dot, norm } from 'mathjs';
import fs from 'fs';
import path from 'path';
import { Configuration, OpenAIApi } from "openai";
import jwt from 'jsonwebtoken';
import Order from '../../../models/Order';


export default async function handler(req, res) {
    const { query } = req.body;
    const maxLength = 4096;

    console.log('--- New message (Notebook chat) ---')

    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decoded?.user) {
        res.status(401).json({ success: false });
    }

    const configuration = new Configuration({
        apiKey: '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', //Notebook-chat-default
    });
    const openai = new OpenAIApi(configuration);

    let messages = req.body.messages;

    //Set first message
    //Make a new message and add it as the very first
    let newMessageObject = {
        content: req.body.systemMessage,
        role: 'system'
    }
    //Add the system message to the messages array as the very first
    messages.unshift(newMessageObject);

    //Let's only keep messages as long as they are less than the max length
    let totalLength = 0;
    for (let i = messages.length; i > 0; i--) {
        totalLength += messages[i - 1].content.length;
        if (totalLength > maxLength) {
            messages = messages.slice(i, messages.length);
            break;
        }
    }

    //console.log('Final messages: ' + JSON.stringify(messages));

    //console.log(req.body.model)
    //console.log(messages)

    //Remove the id from the messages before sending them to the AI
    for (let i = 0; i < messages.length; i++) {
        delete messages[i]._id;
    }


    //Add the context to the last message
    if (req.body.context) {
        messages[messages.length - 1].content += '\n### Context:' + req.body.context;
    }

    console.log('Messages: ' + JSON.stringify(messages));

    const response = await openai.createChatCompletion({
        model: req.body.model,
        messages: messages,
        temperature: 0.2,
        max_tokens: 1024,
    });

    let tokens = response.data.usage.total_tokens;
    let price = (0.002) * (tokens / 1000);

    //Calculate how many messages we could send like this, before it would cost us 1 USD
    let messagesPerUSD = 1 / price;


    console.log('Tokens consumed: ' + tokens);
    console.log('Price: ' + price + ' USD');
    console.log('Messages per USD: ' + messagesPerUSD);
    console.log('Response: ' + response.data.choices[0].message.content);

    res.status(200).json({ message: response.data.choices[0].message.content });

    //Create an Order object
    const order = new Order({
        userid: decoded.user._id,
        input: messages.toString(),
        output: response.data.choices[0].message.content,
        tokens: response.data.usage.total_tokens,
        date: new Date()
    });

    //Save the order to the database
    order.save();
}