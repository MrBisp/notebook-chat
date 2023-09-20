import jwt from 'jsonwebtoken';
import User from "models/User";
export const runtime = 'nodejs'
import OpenAI from 'openai';
import dbConnect from '../../../../utils/dbConnect';


export default async function POST(req, res) {
    await dbConnect();

    //Decode the token
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const amountOfPages = 1;

    if (!decoded) {
        res.status(401).json({ success: false });
    }

    //Let's first get the users 3 most recent pages
    const user = await User.findOne({ _id: decoded.user._id }).populate({
        path: 'workbooks',
        model: 'Workbook',
        populate: {
            path: 'pages',
            model: 'Page',
            options: {
                sort: { lastEdited: -1 },
                limit: amountOfPages,
            },
        },
    }).exec();

    if (!user) {
        res.status(401).json({ success: false });
    }

    //Now let's get the pages
    const lastThreeEditedPages = user.workbooks.reduce((pages, workbook) => {
        return pages.concat(workbook.pages);
    }, []);

    lastThreeEditedPages.sort((a, b) => b.lastEdited - a.lastEdited);

    const pages = lastThreeEditedPages.slice(0, amountOfPages);


    //Let's only keep the title and content
    const pagesForResponse = pages.map(page => {
        return {
            title: page.title,
            content: page.content
        }
    });

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

    let pagesAsString = pagesForResponse.map(page => {
        return 'Title: ' + page.title + '\n Content: ' + convertHtmlToText(page.content);
    }).join(' ');

    //Check if the user has any pages
    if (pagesAsString.length === 0) {
        pagesAsString = "I don't have any notes yet. Instead, suggest me some questions related to getting started with Notebook-chat."
    }


    console.log("Pages as string: ", pagesAsString)


    let description = 'Given the user\'s most recent notes, generate questions the user can ask to start a conversation, that are related to their notes.'
    description += 'Do not reference the notes directly. For example don\'t say: "What are alternatives?", instead say: "What are some alternatives to X?"'
    description += 'For example if the user has a note about a feature idea, generate a question like "What are some ways to get more user signups?"'
    description += 'Or if the user writes about Stalin, maybe generate a question like "What are some ways Stalin could have been a better leader?"'
    description += 'Do not use these examples! Make your own based on the notes!'

    const functions = [{
        name: 'generateSuggestedConversationStarts',
        description: description,
        parameters: {
            type: 'object',
            properties: {
                "question1": {
                    type: 'string',
                    description: 'The first suggested question'
                },
                "question2": {
                    type: 'string',
                    description: 'The second suggested question'
                },
                "question3": {
                    type: 'string',
                    description: 'The third suggested question'
                }
            }
        }
    }]

    const messages = [
        {
            role: 'system',
            content: 'Generate suggested conversation starts'
        },
        {
            role: 'user',
            content: 'Give me suggested conversation starts based on my notes: ' + pagesAsString
        }
    ]

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_TOKEN
    });

    const initialResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo-0613',
        messages,
        temperature: 0.2,
        stream: false,
        functions: functions,
        function_call: 'auto' //This means that the AI will decide when to call the function
    })

    const response = initialResponse.choices[0].message.function_call.arguments;
    console.log("Response: ", response);

    res.status(200).json({
        success: true,
        response
    });
}