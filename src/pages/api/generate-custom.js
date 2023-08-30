import { Configuration, OpenAIApi } from "openai-edge"
import { OpenAIStream, StreamingTextResponse } from "ai"

export const runtime = "edge"

export default async function POST(req) {
    const config = new Configuration({
        apiKey: process.env.OPENAI_TOKEN
    })
    const openai = new OpenAIApi(config)
    // Check if the OPENAI_API_KEY is set, if not return 400

    console.log('--- Generating custom ---')
    console.log('body', req.body)

    let { prompt } = await req.json()
    console.log(prompt)

    const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "system",
                content: "Help the user make changes to their document. Your response will go directly to the user's notes, so please no comments or questions or anything. Simply provide a response"
            },
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: true,
        max_tokens: 150,
        n: 1
    })

    // If the response is unauthorized, return a 401 error
    if (response.status === 401) {
        return new Response("Error: You are unauthorized to perform this action", {
            status: 401
        })
    }
    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response)

    // Respond with the stream
    return new StreamingTextResponse(stream)
}
