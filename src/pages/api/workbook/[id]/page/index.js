import dbConnect from "utils/dbConnect";
import User from "models/User";
import { Workbook, Page } from "models/Workbook";
import jwt from "jsonwebtoken";

export default async (req, res) => {
    await dbConnect();

    const {
        method,
        query: { id }
    } = req;

    switch (method) {
        case "POST":
            const title = req.body.title || '';
            const parentPageId = req.body.parentPageId || null;

            try {
                if (parentPageId == null) {
                    const token = req.headers.authorization.split(' ')[1];
                    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

                    const user = await User.findOne({ _id: decoded.user._id });

                    const workbook = await Workbook.findOne({ _id: id });

                    if (workbook) {
                        const newPage = new Page({
                            title: title,
                            subPages: []
                        });

                        await newPage.save();

                        workbook.pages.push(newPage);

                        await workbook.save();

                        res.status(200).json({ success: true, page: newPage });
                    }
                } else {
                    const workbook = Workbook.findOne({ _id: id });

                    if (workbook) {
                        const page = {
                            title: title,
                            subPages: [],
                            content: ''
                        }

                        workbook.pages.forEach((page) => {
                            if (page._id == parentPageId) {
                                page.subPages.push(page);
                            }
                        });

                        await workbook.save();

                        res.status(200).json({ success: true, data: page });
                    }
                }

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