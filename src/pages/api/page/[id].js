import dbConnect from "utils/dbConnect";
import User from "models/User";
import UserPageAccess from "models/UserPageAccess";
import UserWorkbookAccess from "models/UserWorkbookAccess";
import { Page, Workbook } from "models/Workbook";
import jwt from "jsonwebtoken";
import { Pinecone } from '@pinecone-database/pinecone';

export default async (req, res) => {
    await dbConnect();

    const {
        method, query: { id }
    } = req;

    const page = await Page.findOne({ _id: id });
    let accessLevel;

    if (!page) {
        res.status(404).json({ success: false, error: "Page not found" });
        return;
    }

    //console.log(req.headers.authorization)
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);


    //Get user and populate with both workbooks and populate the workbooks with the pages
    const userPageAccess = await UserPageAccess.find({
        user: decoded.user._id,
        page: id
    }).exec();

    //console.log(userPageAccess);


    //If the user has access to the page, then continue
    if (userPageAccess.length === 0) {
        const workbook = await Workbook.findOne({ pages: id });
        if (!workbook) {
            res.status(404).json({ success: false, message: "Page does not belong to any workbook" });
            return;
        }

        const userWorkbookAccess = await UserWorkbookAccess.findOne({ workbook: workbook._id, user: decoded.user._id });

        if (!userWorkbookAccess) {
            res.status(401).json({ success: false, error: "User does not have access to this page or its workbook" });
            return;
        }
        accessLevel = userWorkbookAccess.accessLevel;
    } else {
        accessLevel = userPageAccess[0].accessLevel;
    }



    switch (method) {
        case "GET":
            try {
                //Get the page
                const page = await Page.findById(id);
                res.status(200).json({
                    success: true,
                    page: page,
                    accessLevel: accessLevel
                });
            } catch (error) {
                res.status(400).json({ success: false, error: error });
            }
            break;
        case "PUT":
            try {
                const allowedPermissions = ["write", "owner"]
                //First check if the user has write access to the page
                if (!allowedPermissions.includes(accessLevel)) {
                    res.status(401).json({ success: false, error: "User does not have write access to this page" });
                    return;
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
                if (req.body.workbookId) {
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
            try {
                if (accessLevel !== "owner") {
                    res.status(401).json({ success: false, error: "User does not have write access to this page" });
                    return;
                }

                //Delete the page
                const deletedPage = await Page.findByIdAndDelete(id);
                res.status(200).json({ success: true });

                //Now update the workbook
                const workbook = await Workbook.findOne({ _id: req.body.workbookId });
                if (workbook) {
                    workbook.lastEdited = Date.now();
                    await workbook.save();
                }

                //Now remove the page from pinecone
                const pinecone = new Pinecone({
                    apiKey: process.env.PINECONE_API_KEY,
                    environment: process.env.PINECONE_ENVIRONMENT
                })
                const index = pinecone.index(process.env.PINECONE_INDEX);
                await index.deleteOne(id);

                //Now remove the page from the user's page access
                await UserPageAccess.deleteMany({ page: id });

                //Now remove the page from the workbook
                await Workbook.updateOne(
                    { _id: req.body.workbookId },
                    { $pull: { pages: id } }
                );

            } catch (error) {
                console.log(error)
                res.status(400).json({ success: false, error: error });
            }

            break;
        default:
            res.status(400).json({ success: false });
            break;
    }
}