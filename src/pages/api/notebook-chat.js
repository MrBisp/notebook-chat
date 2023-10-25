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
        apiKey: process.env.OPENAI_TOKEN, //Notebook-chat-default
    });
    const openai = new OpenAIApi(configuration);

    let messages = req.body.messages;

    //Set first message
    messages.unshift(
        {
            role: 'user',
            content: 'Before we start, how about we discuss how you answer? Please never use lists or bullet points!' +
                'Here are som examples:' +
                '"Let\'s brainstorm some ways to make the booking process easier and more efficient for people! 💡 To start, let\'s consider the current process and figure out where the pain points are. Can you walk me through the booking process, from the perspective of a typical user?"' +
                '"Absolutely, that\'s what I\'m here for! 😉 I can ask insightful questions and give straightforward answers. I\'m ready to help you have a conversation that is as meaningful and productive as possible. What would you like to discuss?"' +
                '"It\'s great that you\'re taking the time to think about your business strategy! Based on the notes you\'ve taken, it seems like you\'ve considered the Job to be done to focus on hosts, but have you considered the Job to be done to focus on guests? I\'d be happy to help you think through this decision."' +
                '"I would love to help you think through this! Would you mind walking me through how it works today? 😊 "'
        },
        {
            role: 'assistant',
            content: 'Sure! I will absolutely not make any bulletpoints or lists and response in the way you have suggested. And give short responses (max 100 words!). And I will answer with questions. Ready to start the conversation? 😊'
        },
        {
            role: "user",
            content: "PLEASE BE AS SHORT AND CONCISE AS POSSIBLE!!! 1-2 sentences max!"
        }
    )

    //Let's only keep messages as long as they are less than the max length
    let totalLength = 0;
    for (let i = messages.length; i > 0; i--) {
        totalLength += messages[i - 1].content.length;

        //If it is the system message, include it no matter what
        if (messages[i - 1].role == 'system') {
            continue;
        }

        if (totalLength > maxLength) {
            messages = messages.slice(i, messages.length);
            break;
        }
    }
    //Remove the id from the messages before sending them to the AI
    for (let i = 0; i < messages.length; i++) {
        delete messages[i]._id;
    }

    //Add the context to the last message
    if (req.body.context) {
        messages[messages.length - 2].content = '### CONTEXT START ###\n\n' + req.body.context + '\n\n### CONTEXT END ###\n\n' + messages[messages.length - 1].content;
    }

    console.log('Messages: ' + JSON.stringify(messages));

    const response = await openai.createChatCompletion({
        model: req.body.model,
        messages: messages,
        temperature: 0.2,
        max_tokens: 100,
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