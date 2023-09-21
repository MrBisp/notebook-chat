import { Pinecone } from '@pinecone-database/pinecone';
import jwt from 'jsonwebtoken';
import { Page } from "models/Workbook";
import { OpenAIStream, streamToResponse } from 'ai';
import OpenAI from 'openai';
import dbConnect from '../../../../utils/dbConnect';
export const runtime = 'nodejs'

export default async function POST(req, res) {
    await dbConnect();
    const { messages } = req.body;

    let pagesForResponse = [];

    //const addToMessage = " [if I am asking for something that could be in my notes, check in my notes (but of course not for follow-up questions). Focus on answering my question, not reciting my notes! Draw on my notes for extra context when needed. Give me a short but insightful answer!]"
    const addToMessage = "";
    const minSimiliarty = 0.70;
    const maxTokens = 150;
    const temperature = 0.9;

    //Decode the token
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decoded) {
        res.status(401).json({ success: false });
    }

    function convertHtmlToText(string) {
        var returnText = "" + string;

        //-- remove BR tags and replace them with line break
        returnText = returnText.replace(/<br>/gi, "");
        returnText = returnText.replace(/<br\s\/>/gi, "");
        returnText = returnText.replace(/<br\/>/gi, "");

        //-- remove P and A tags but preserve what's inside of them
        returnText = returnText.replace(/<p.*?>/gi, "");
        returnText = returnText.replace(/<a.*href="(.*?)".*>(.*?)<\/a>/gi, " $2 ($1)");

        // - Same with span
        returnText = returnText.replace(/<span.*?>/gi, "");
        returnText = returnText.replace(/<\/span>/gi, "");

        //-- remove all inside SCRIPT and STYLE tags
        returnText = returnText.replace(/<script.*>[\w\W]{1,}(.*?)[\w\W]{1,}<\/script>/gi, "");
        returnText = returnText.replace(/<style.*>[\w\W]{1,}(.*?)[\w\W]{1,}<\/style>/gi, "");
        //-- remove all else
        returnText = returnText.replace(/<(?:.|\s)*?>/g, "");

        //-- get rid of more than 2 multiple line breaks:
        returnText = returnText.replace(/(?:(?:\r\n|\r|\n)\s*){2,}/gim, "");

        //-- get rid of more than 2 spaces:
        returnText = returnText.replace(/ +(?= )/g, '');

        //-- get rid of html-encoded characters:
        returnText = returnText.replace(/&nbsp;/gi, " ");
        returnText = returnText.replace(/&amp;/gi, "&");
        returnText = returnText.replace(/&quot;/gi, '"');
        returnText = returnText.replace(/&lt;/gi, '<');
        returnText = returnText.replace(/&gt;/gi, '>');

        //-- return
        return returnText;
    }

    async function getPagesFromPinecone(query) {
        //First embed the query
        const url = "https://api.openai.com/v1/embeddings";
        const headers = {
            'Authorization': `Bearer ${process.env.OPENAI_TOKEN}`,
            'Content-Type': 'application/json'
        }
        const body = {
            'input': query,
            'model': 'text-embedding-ada-002'
        }
        const response = await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(body) });
        const data = await response.json();
        const embeddings = data.data[0].embedding;


        //Then search the index
        const pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
            environment: process.env.PINECONE_ENVIRONMENT
        })
        const index = pinecone.index(process.env.PINECONE_INDEX);

        const queryResponse = await index.query({
            vector: embeddings,
            topK: 3,
            includeValues: false,
            filter: {
                "userId": decoded.user._id
            }
        });
        const matches = queryResponse.matches;
        //If there are no matches, return an empty array
        if (matches.length === 0) {
            return [];
        }

        //Only keep matches that are above a certain threshold
        matches.forEach((match, index) => {
            if (match.score < minSimiliarty) {
                matches.splice(index, 1);
            }
        })

        //TODO: Get the pages from the database
        const pages = await Page.find({ _id: { $in: matches.map((match) => match.id) } });

        pagesForResponse = pages;

        console.log("Amount of pages: ", pages.length)

        //Remove html from the content
        pages.forEach((page) => {
            page.content = convertHtmlToText(page.content);
        })

        //Only return the ID, title and content
        return pages.map((page) => {
            return {
                id: page._id,
                title: page.title,
                content: page.content
            }
        });
    }

    const runFunction = async (name, args) => {
        switch (name) {
            case 'getPagesFromPinecone':
                console.log("Running getPagesFromPinecone function with args: ", args);
                return await getPagesFromPinecone(args.query);
            default:
                throw null;
        }
    }

    //Add a system message to the start of the messages array
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
            content: 'Sure! I will absolutely not make any bulletpoints or lists and response in the way you have suggested. And give short responses (max 100 words!) Ready to start the conversation? 😊'
        }
    )

    //Alter the latest message
    messages[messages.length - 1].content = messages[messages.length - 1].content + addToMessage;

    const functions = [{
        name: 'getPagesFromPinecone',
        description: 'Given a query, finds the most relevant pages from the user\'s notes, and returns the pages. Use this function whenever the user asks any question! The user expects that you search in their notes!',
        parameters: {
            type: 'object',
            properties: {
                "query": {
                    type: 'string',
                    description: 'The query to search for.'
                }
            },
            required: ['query']
        }
    }]

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_TOKEN
    });


    //GUIDE: https://vercel.com/guides/openai-function-calling
    const initialResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo-0613',
        messages,
        temperature: temperature,
        stream: true,
        max_tokens: maxTokens,
        functions: functions,
        function_call: 'auto' //This means that the AI will decide when to call the function
    })


    const stream = OpenAIStream(initialResponse, {
        experimental_onFunctionCall: async function ({ name, arguments: args }, createFunctionCallMessages) {
            const result = await runFunction(name, args);
            const newMessages = createFunctionCallMessages(result);
            //console.log("Messages (after function call): ", [...messages, ...newMessages])

            return openai.chat.completions.create({
                model: "gpt-3.5-turbo-0613",
                stream: true,
                messages: [...messages, ...newMessages],
                temperature: 0.2,
                max_tokens: maxTokens,
            });
        },
    });

    return new streamToResponse(stream, res)
}