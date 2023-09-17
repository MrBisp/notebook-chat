import { Pinecone } from '@pinecone-database/pinecone';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../utils/dbConnect';
import { Page, Workbook } from "models/Workbook";
import User from '../../../../models/User'

export default async function handler(req, res) {

    //Check that the user is logged in
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decoded) {
        res.status(401).json({ success: false, message: "Not authorized (jwt)" });
        return;
    }

    //First embed the query
    const url = "https://api.openai.com/v1/embeddings";
    const headers = {
        'Authorization': `Bearer ${process.env.OPENAI_TOKEN}`,
        'Content-Type': 'application/json'
    }
    const body = {
        'input': req.body.content,
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

    res.status(200).json({ success: true, results: queryResponse.matches });



}