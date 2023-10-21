import dbConnect from "utils/dbConnect";
import User from "models/User";
import { Workbook, Page } from "models/Workbook";
import UserPageAccess from "models/UserPageAccess";
import jwt from "jsonwebtoken";

export default async (req, res) => {
    await dbConnect();

    const {
        method,
        query: { id }
    } = req;

    switch (method) {
        //Add a new page to the workbook
        case "POST":
            //console.log('Trying to add a new page', req.body)
            const title = req.body.title || '';
            const parentPageId = req.body.parentPageId || null;

            try {
                if (parentPageId == null) {
                    const token = req.headers.authorization.split(' ')[1];
                    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

                    if (!decoded?.user?._id) {
                        res.status(400).json({ success: false, error: 'Invalid user' });
                    }

                    //Check if the user contains the workbook (user.workbooks._id)
                    const user = decoded.user;

                    if (!user.workbooks.includes(id)) {
                        res.status(401).json({ success: false, error: 'User does not have access to this workbook' });
                        return;
                    }


                    const workbook = await Workbook.findOne({ _id: id });

                    if (workbook) {
                        const newPage = new Page({
                            title: title,
                            subPages: [],
                            content: req.body.content || ' '
                        });
                        await newPage.save();

                        workbook.pages.push(newPage._id);
                        workbook.lastEdited = new Date();
                        await workbook.save();

                        //Now, add the page to the user's page access
                        const userPageAccess = new UserPageAccess({
                            user: user._id,
                            page: newPage._id,
                            accessLevel: 'owner'
                        });
                        await userPageAccess.save();

                        //Everything is good
                        res.status(200).json({ success: true, page: newPage });
                    }
                } else {
                    const workbook = Workbook.findOne({ _id: id });

                    if (workbook) {
                        const newPage = new Page({
                            title: title,
                            subPages: [],
                            content: req.body.content || ''
                        });

                        await newPage.save();

                        console.log('New page', newPage)

                        workbook.pages.forEach((page) => {
                            if (page._id == parentPageId) {
                                page.subPages.push(newPage._id);
                            }
                        });

                        workbook.lastEdited = new Date();

                        await workbook.save();

                        res.status(200).json({ success: true, data: page });
                    } else {
                        res.status(400).json({ success: false, error: 'Workbook not found' });
                    }
                }

            } catch (error) {
                console.log(error)
                res.status(400).json({ success: false, error: error });
            }

            break;

        case "PUT":
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

                if (!decoded?.user?._id) {
                    res.status(400).json({ success: false, error: 'Invalid user' });
                }

                Workbook.findOneAndUpdate({ _id: id }, req.body, { new: true }, (err, workbook) => {
                    if (err) {
                        res.status(400).json({ success: false, error: err });
                    } else {
                        res.status(200).json({ success: true, data: workbook });
                    }
                });


            } catch (error) {
                console.log(error)
                res.status(400).json({ success: false, error: error });
            }
            break;

        case "DELETE":
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

                if (!decoded?.user?._id) {
                    res.status(400).json({ success: false, error: 'Invalid user' });
                }

                Workbook.findOneAndDelete({ _id: id }, (err, workbook) => {
                    if (err) {
                        res.status(400).json({ success: false, error: err });
                    } else {
                        res.status(200).json({ success: true, data: workbook });
                    }
                });

            } catch (error) {
                console.log(error)
                res.status(400).json({ success: false, error: error });
            }
            break;

        default:
            console.log('We only support POST requests')
            res.status(400).json({ success: false });
            break;
    }
}