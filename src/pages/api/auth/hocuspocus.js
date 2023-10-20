import dbConnect from "utils/dbConnect";
import User from "models/User";
import UserPageAccess from "models/UserPageAccess"
import jwt from "jsonwebtoken";

const handler = async (req, res) => {
    await dbConnect();

    console.log('Hocus Pocus auth handler')

    const { method } = req;

    switch (method) {
        case "POST":
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

                console.log(decoded.user._id)
                console.log(req.body)
                console.log(JSON.parse(req.body).pageId);

                const userPageAccess = await UserPageAccess.find({
                    user: decoded.user._id,
                    page: JSON.parse(req.body).pageId
                }).exec();

                console.log(userPageAccess);

                //If the user has access to the page, then continue
                if (userPageAccess.length === 0) {
                    res.status(401).json({ success: false, error: "User does not have access to this page" });
                    return;
                }

                console.log('Successfully found user')
                res.status(200).json({ success: true, user: decoded.user });
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