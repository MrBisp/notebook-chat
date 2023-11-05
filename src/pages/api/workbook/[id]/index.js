import dbConnect from "utils/dbConnect";
import User from "models/User";
import UserPageAccess from "models/UserPageAccess";
import UserWorkbookAccess from "models/UserWorkbookAccess";
import { Workbook, Page } from "models/Workbook";
import jwt from "jsonwebtoken";
import { Pinecone } from '@pinecone-database/pinecone';

export default async (req, res) => {
    await dbConnect();

    const {
        method,
        query: { id }
    } = req;

    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decoded?.user) {
        res.status(401).json({ success: false });
        return;
    }

    //Check if the user contains the workbook (user.workbooks._id)
    const user = decoded.user;

    if (!user.workbooks.includes(id)) {
        res.status(401).json({ success: false });
        return;
    }

    switch (method) {
        //Make a change to a workbook
        case "PUT":
            //Update the workbook and populate with pages
            const w = await Workbook.findOneAndUpdate(
                { _id: id },
                { ...req.body, lastEdited: new Date() },
                { new: true }
            ).populate('pages');

            if (!w) {
                res.status(400).json({ success: false });
                return;
            }

            res.status(200).json({ success: true, workbook: w });
            break;

        //Delete a workbook
        case "DELETE":
            //Delete the workbook and all pages
            const wBeforeDelete = await Workbook.findOne({ _id: id });
            const pages_ids = wBeforeDelete.pages;
            const pages = await Page.deleteMany({ _id: { $in: pages_ids } });
            const wDelete = await Workbook.deleteOne({ _id: id });

            //Now, delete from pinecone
            const pinecone = new Pinecone({
                apiKey: process.env.PINECONE_API_KEY,
                environment: process.env.PINECONE_ENVIRONMENT
            })
            const index = pinecone.index(process.env.PINECONE_INDEX);
            await index.deleteMany(pages_ids);

            if (!wDelete) {
                res.status(400).json({ success: false });
                return;
            }

            //Remove the workbook from the user's workbooks
            const user = await User.findOne({ _id: decoded.user._id });
            const indexToDelete = user.workbooks.indexOf(id);
            if (indexToDelete > -1) {
                user.workbooks.splice(indexToDelete, 1);
            }
            await user.save();

            //Remove the workbook from the user's workbook access
            await UserWorkbookAccess.deleteMany({ workbook: id });

            //Remove the workbook from the user's page access
            await UserPageAccess.deleteMany({ page: { $in: pages_ids } });


            res.status(200).json({ success: true });

        default:
            res.status(400).json({ success: false });
            break;
    }
}