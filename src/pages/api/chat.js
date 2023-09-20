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
    messages.unshift({
        role: 'system',
        content: 'You are a chatbot on the website Notebook-chat.com. Users can talk to you about their notes.' +
            'The notes they have picked to include in the conversation, is included as context.' +
            'The user can create a new chat by pressing clear.' +
            'They can also press \'+++\' in their notebook to get AI auto-complete' +
            'The AI is made by OpenAI, and the auto complete is based on Novel.sh'
    })


    const res = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        stream: true
    })

    const stream = OpenAIStream(res);

    return new StreamingTextResponse(stream)
}