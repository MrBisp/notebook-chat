import { OpenAIStream, streamToResponse } from 'ai';
import OpenAI from 'openai';
export const runtime = 'nodejs'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_TOKEN
})

export default async function POST(req, res) {
    const { messages } = req.body;

    //Add a system message to the start of the messages array
    messages.unshift({
        role: 'system',
        content: 'You are a chatbot on the website Notebook-chat.com. Users can talk to you about their notes.' +
            'Some notes are automatically included as context by using vector search.'
    })

    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        stream: true,
        max_tokens: 150
    })

    const stream = OpenAIStream(response);

    return streamToResponse(stream, res);
}