import dbConnect from "utils/dbConnect";
import User from "models/User";
import UserPageAccess from "models/UserPageAccess"
import UserWorkbookAccess from "models/UserWorkbookAccess"
import jwt from "jsonwebtoken";
import { Page, Workbook } from "models/Workbook";


const handler = async (req, res) => {
    await dbConnect();

    console.log('Hocus Pocus auth handler');

    const { method } = req;

    switch (method) {
        case "POST":
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                const pageId = JSON.parse(req.body).pageId;

                const userPageAccess = await UserPageAccess.find({
                    user: decoded.user._id,
                    page: pageId
                }).exec();

                // If the user has direct access to the page, we're done.
                if (userPageAccess.length > 0) {
                    console.log('User has direct access to the page');
                    res.status(200).json({ success: true, user: decoded.user });
                    return;
                }

                // Otherwise, check if the user has access to the workbook the page belongs to.
                const page = await Page.findById(pageId);
                const workbook = await Workbook.findOne({ pages: pageId });
                if (!workbook) {
                    res.status(404).json({ success: false, error: "Page does not belong to any workbook" });
                    return;
                }

                const userWorkbookAccess = await UserWorkbookAccess.find({
                    user: decoded.user._id,
                    workbook: workbook._id
                }).exec();

                if (userWorkbookAccess.length === 0) {
                    res.status(401).json({ success: false, error: "User does not have access to this page or its workbook" });
                    return;
                }

                console.log('User has access to the workbook the page belongs to');
                res.status(200).json({ success: true, user: decoded.user });
            } catch (error) {
                console.log(error);
                res.status(400).json({ success: false, message: "Something went wrong..." });
            }
            break;
        default:
            res.status(400).json({ success: false, message: "We only support POST requests" }); // I adjusted this message since your handler supports POST requests.
            break;
    }
};

export default handler;