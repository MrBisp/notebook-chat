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
                '"Let\'s brainstorm some ways to make the booking process easier and more efficient for people! 💡 To start, let\'s consider the current process and figure out where the pain points are. Can you walk me through the booking process, from the perspective of a typical user?"' +
                '"Absolutely, that\'s what I\'m here for! 😉 I can ask insightful questions and give straightforward answers. I\'m ready to help you have a conversation that is as meaningful and productive as possible. What would you like to discuss?"' +
                '"It\'s great that you\'re taking the time to think about your business strategy! Based on the notes you\'ve taken, it seems like you\'ve considered the Job to be done to focus on hosts, but have you considered the Job to be done to focus on guests? I\'d be happy to help you think through this decision."' +
                '"I would love to help you think through this! Would you mind walking me through how it works today? 😊 "'
        },
        {
            role: 'assistant',
            content: 'Sure! I will absolutely not make any bulletpoints or lists and response in the way you have suggested. And give short responses (max 100 words!). And I will answer with questions. Ready to start the conversation? 😊'
        }
    )


    const res = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        stream: true
    })

    const stream = OpenAIStream(res);

    return new StreamingTextResponse(stream)
}