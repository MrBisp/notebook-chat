import UserPageAccess from 'models/UserPageAccess';
import dbConnect from 'utils/dbConnect';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    await dbConnect();

    const { method } = req;

    //console.log('Shared with user: ', req.headers.authorization);

    switch (method) {
        case "GET":
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

                if (!decoded) {
                    res.status(401).json({ success: false, error: "Invalid token" });
                    return;
                }

                //Find all the pages that the user has access to and where accessLevel is not 'owner'
                const userPageAccess = await UserPageAccess.find({ user: decoded.user._id, accessLevel: { $ne: 'owner' } }).populate('page').exec();

                console.log(userPageAccess);
                res.status(200).json({ success: true, pages: userPageAccess.map((upa) => upa.page) });
            } catch (error) {
                res.status(400).json({ success: false, error: error });
            }

            break;
        default:
            console.log('Shared with user: We only support GET requests')
            res.status(400).json({ success: false, message: "We only support GET requests" });
            break;
    }
}