import dbConnect from "utils/dbConnect";
import User from "models/User";
import { Workbook, Page } from "models/Workbook";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const handler = async (req, res) => {
    await dbConnect();

    const { method } = req;

    switch (method) {
        case "POST":
            console.log('Trying to login')
            try {
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

                const authToken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });

                console.log('Successfully logged in');
                res.status(200).json({ user: { id: user.id, email: user.email }, authToken });
            } catch (error) {
                console.log(error)
                res.status(400).json({ success: false, message: error.message });
            }
            break;
        default:
            res.status(400).json({ success: false, message: "We only support POST requests" });
            break;
    }
};

export default handler;