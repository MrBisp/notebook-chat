import dbConnect from "utils/dbConnect";
import User from "models/User";
import Workbook from "models/Workbook";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const handler = async (req, res) => {
    await dbConnect();

    const { method } = req;

    switch (method) {
        case "GET":
            try {
                console.log('Trying to get user from Bearer token')
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                const user = await User.findById(decoded.user._id).populate({
                    path: 'workbooks',
                    populate: {
                        path: 'pages',
                        populate: {
                            path: 'subPages',
                        }
                    }
                });

                if (!user) {
                    console.log('User not found')
                    return res.status(401).json({ success: false, message: 'User not found' });
                }

                console.log('Successfully found user')
                res.status(200).json({ user: { id: user.id, email: user.email, conversations: user.conversations, token: user.token, workbooks: user.workbooks } });

            } catch (error) {
                console.log(error)
                res.status(400).json({ success: false, message: "Something went wrong..." });
            }
            break;
        default:
            res.status(400).json({ success: false, message: "We only support GET requests" });
            break;
    }
};

export default handler;