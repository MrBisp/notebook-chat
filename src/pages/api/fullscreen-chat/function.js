import { Pinecone } from '@pinecone-database/pinecone';
import jwt from 'jsonwebtoken';
import { Page } from "models/Workbook";
import { OpenAIStream, streamToResponse } from 'ai';
import OpenAI from 'openai';
import dbConnect from '../../../../utils/dbConnect';
import Memory from '../../../../models/Memory';
export const runtime = 'nodejs'

export default async function POST(req, res) {
    await dbConnect();
    const { messages } = req.body;
    console.log(req.body);
    let memories = req.body.memories;
    if (memories) {
        //Right now, the memories are objects. Grab the actual memory from object.memory
        memories = memories.map((memory) => memory.memory);
    }

    let gptVersion = req.body.gptVersion ? req.body.gptVersion : 'gpt-3.5-turbo';

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

    async function saveMemory(memory) {
        const newMemory = new Memory({
            user: decoded.user._id,
            memory: memory,
            importance: 0
        });
        const newmemory = await newMemory.save();
        return "memory saved."
    }

    const runFunction = async (name, args) => {
        switch (name) {
            case 'getPagesFromPinecone':
                console.log("Running getPagesFromPinecone function with args: ", args);
                return await getPagesFromPinecone(args.query);
            case 'saveMemory':
                console.log("Running saveMemory function with args: ", args);
                return await saveMemory(args.memory);
            default:
                throw null;
        }
    }


    //Add a system message to the start of the messages array
    messages.unshift(
        {
            role: 'system',
            content: 'You are an AI on Notebook-chat.com that allows the user to chat with an AI, that knows about the user. ' +
                'You have access to your own memories about the user, and can look into the user\'s notes to see what is on their mind. ' +
                'You uses casual, comforting language to foster a sense of understanding and companionship, and professional advice when needed.' +
                'You should ask open-ended questions to encourage further conversation.'
        },
        {
            role: 'assistant',
            content: 'Here are the memories I have about the user: ' + memories.join(', ')
        },
        {
            role: 'user',
            content: 'Here are how I want you to respond to my messages (short and without lists or bulletpoints):' +
                'Ugh, work stress is the wooorst. What happened that made the day so rough? Was it a specific project, or just a general sense of overwhelm?' +
                'Bingo, you hit the nail on the head! That\'s why people are studying it.'
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
    }, {
        name: 'saveMemory',
        description: 'Saves a memory about the user. Use this function whenever the user tells you something new and meaningful, that you should remember.',
        parameters: {
            type: 'object',
            properties: {
                "memory": {
                    type: 'string',
                    description: 'The memory to save as a short string.'
                }
            },
            required: ['memory']
        }

    }]

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_TOKEN
    });


    //GUIDE: https://vercel.com/guides/openai-function-calling
    const initialResponse = await openai.chat.completions.create({
        model: gptVersion,
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
                model: gptVersion,
                stream: true,
                messages: [...messages, ...newMessages],
                temperature: 0.2,
                max_tokens: maxTokens,
            });
        },
    });

    return new streamToResponse(stream, res)
}