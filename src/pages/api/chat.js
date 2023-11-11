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

    //Get memories from request body
    let memories = json.memories;
    if (memories) {
        //Right now, the memories are objects. Grab the actual memory from object.memory
        memories = memories.map((memory) => memory.memory);
    }

    //Get gptVersion
    let gptVersion = json.gptVersion ? json.gptVersion : 'gpt-3.5-turbo';


    if (previewToken) {
        configuration.apiKey = previewToken
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


    const res = await openai.createChatCompletion({
        model: gptVersion,
        messages,
        temperature: 0.5,
        stream: true,
        max_tokens: 100,
    })

    const stream = OpenAIStream(res);

    return new StreamingTextResponse(stream)
}