import { Pinecone } from '@pinecone-database/pinecone';

export default async function handler(req, res) {
    const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
        environment: process.env.PINECONE_ENVIRONMENT
    })
    let indexes = await pinecone.listIndexes()
    return res.status(200).json({ indexes })


}