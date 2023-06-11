import dbConnect from "utils/dbConnect";
import User from "models/User";
import { Page, Workbook } from "models/Workbook";
import jwt from "jsonwebtoken";

export default async (req, res) => {
    await dbConnect();

    const {
        method,
        query: { id }
    } = req;

    switch (method) {
        case "PUT":
            try {
                const page = Page.findOne({ _id: id });

                if (page) {
                    const token = req.headers.authorization.split(' ')[1];
                    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

                    const user = await User.findOne({ _id: decoded.user._id });

                    if (!user) {
                        res.status(401).json({ success: false });
                    }

                    //Update the page with changes from req.body.data
                    const updates = {}
                    if (req.body.title) {
                        updates.title = req.body.title;
                    }
                    if (req.body.content) {
                        updates.content = req.body.content;
                    }
                    if (req.body.subPages) {
                        updates.subPages = req.body.subPages;
                    }
                    updates.lastEdited = Date.now();

                    //Update the page
                    const updatedPage = await Page.findByIdAndUpdate(id, updates, { new: true });
                    res.status(200).json({ success: true, page: updatedPage });

                    //Now update the workbook
                    const workbook = await Workbook.findOne({ _id: req.body.workbookId });
                    if (workbook) {
                        workbook.lastEdited = Date.now();
                        await workbook.save();
                    }
                }
            } catch (error) {
                console.log(error)
                res.status(400).json({ success: false, error: error });
            }
            break;
        case "DELETE":

            break;
        default:
            res.status(400).json({ success: false });
            break;
    }
}