import { Pinecone } from '@pinecone-database/pinecone';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../utils/dbConnect';
import { Page, Workbook } from "models/Workbook";
import UserPageAccess from 'models/UserPageAccess'
import UserWorkbookAccess from 'models/UserWorkbookAccess';
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

    const userPageAccess = await UserPageAccess.findOne({ page: pageId, user: userId });

    if (userPageAccess && (userPageAccess.accessLevel === "write" || userPageAccess.accessLevel === "owner")) {
        //Then we're good (skip to the next step)
    } else {
        // Check access to the workbook the page belongs to
        const workbook = await Workbook.findOne({ pages: pageId });
        if (!workbook) {
            res.status(404).json({ success: false, message: "Page does not belong to any workbook" });
            return;
        }

        const userWorkbookAccess = await UserWorkbookAccess.findOne({ workbook: workbook._id, user: userId });

        if (!userWorkbookAccess || !(userWorkbookAccess.accessLevel === "write" || userWorkbookAccess.accessLevel === "owner")) {
            res.status(401).json({ success: false, message: "Not authorized (accessLevel)" });
            return;
        }
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


    //Now get the 3 most similar pages
    const similar = await index.query({
        vector: embeddings,
        topK: 3,
        includeValues: false,
        filter: {
            "userId": decoded.user._id
        }
    })

    res.status(200).json({ success: true, message: "Successfully updated embeddings", similar: similar.matches });
}