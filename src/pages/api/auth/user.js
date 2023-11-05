import dbConnect from "utils/dbConnect";
import User from "models/User";
import Workbook from "models/Workbook";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserWorkbookAccess from "models/UserWorkbookAccess";

const handler = async (req, res) => {
    await dbConnect();

    const { method } = req;

    switch (method) {
        case "GET":
            try {
                console.log('Trying to get user from Bearer token');
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

                // Find the user's workbook access entries
                const workbookAccessEntries = await UserWorkbookAccess.find({ user: decoded.user._id })
                    .populate({
                        path: 'workbook',
                        populate: {
                            path: 'pages',
                            populate: {
                                path: 'subPages',
                            }
                        }
                    });

                // Extract the workbooks from the access entries
                const workbooks = workbookAccessEntries.map(entry => entry.workbook);

                console.log('Successfully found user and their workbooks');
                res.status(200).json({ user: { id: decoded.user._id, email: decoded.user.email, workbooks: workbooks } });
            } catch (error) {
                console.log(error);
                res.status(400).json({ success: false, message: "Something went wrong..." });
            }
            break;
    }
};

export default handler;