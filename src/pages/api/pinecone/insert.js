import { Pinecone } from '@pinecone-database/pinecone';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../utils/dbConnect';
import { Page, Workbook } from "models/Workbook";
import UserPageAccess from 'models/UserPageAccess'
import User from '../../../../models/User'

export default async function handler(req, res) {
    await dbConnect();

    //Check that the user is logged in
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decoded) {
        res.status(401).json({ success: false, message: "Not authorized (jwt)" });
        return;
    }

    //Check that the user has write access to the page (or is the owner)
    const pageId = req.body.pageId;
    const userId = decoded.user._id;

    const userpageaccess = await UserPageAccess.findOne({ page: pageId, user: userId });
    const accessLevel = userpageaccess.accessLevel;

    if (accessLevel != "write" && accessLevel != "owner") {
        res.status(401).json({ success: false, message: "Not authorized (accessLevel)" });
        return;
    }

    //User is allowed to edit the page
    //Embed the page using OpenAI embeddings
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



    //Pinecone
    const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
        environment: process.env.PINECONE_ENVIRONMENT
    })
    const index = pinecone.index(process.env.PINECONE_INDEX);
    const metadata = {
        userId: userId
    }
    const records = [
        {
            "id": req.body.pageId,
            "values": embeddings,
            "metadata": metadata
        }
    ]
    await index.upsert(records);
    res.status(200).json({ success: true, message: "Successfully updated embeddings" });
}