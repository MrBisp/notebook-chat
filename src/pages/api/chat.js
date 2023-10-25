import { OpenAIStream, StreamingTextResponse } from 'ai'
import { Configuration, OpenAIApi } from 'openai-edge'

export const runtime = 'edge'

const configuration = new Configuration({
    apiKey: process.env.OPENAI_TOKEN
})

const openai = new OpenAIApi(configuration)

export default async function POST(req) {
    const json = await req.json()
    const { messages, previewToken } = json

    if (previewToken) {
        configuration.apiKey = previewToken
    }

    //Add a system message to the start of the messages array
    messages.unshift(
        {
            role: 'system',
            content: 'You are a chatbot on the website Notebook-chat.com. Users can talk to you about their notes.' +
                'The notes they have picked to include in the conversation, is included as context.'
        },
        {
            role: 'user',
            content: 'Before we start, how about we discuss how you answer? Please never use lists or bullet points!' +
                'Here are som examples:' +
                '"Can you walk me through the booking process, from the perspective of a typical user? 😊"' +
                '"To start the conversation, let\'s focus on the features you mentioned. What would you like to start with? 😊"' +
                '"Based on the notes you\'ve taken, it seems like you\'ve considered the Job to be done to focus on hosts, but have you considered the Job to be done to focus on guests? 😊"' +
                '"Would you mind walking me through how it works today? 😊 "' +
                'Please, do make line breaks, I really need your responses to be easily readable.'
        },
        {
            role: 'assistant',
            content: 'Sure! I will absolutely not make any bulletpoints or lists and response in the way you have suggested. And give short reponses. Ready to start the conversation? 😊'
        },
        {
            role: "user",
            content: "PLEASE BE AS SHORT AND CONCISE AS POSSIBLE!!! 1-2 sentences max!"
        }
    )


    const res = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.5,
        stream: true,
        max_tokens: 100,
    })

    const stream = OpenAIStream(res);

    return new StreamingTextResponse(stream)
}