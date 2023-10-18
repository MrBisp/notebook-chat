import UserPageAccess from '../../../../models/UserPageAccess'
import Invitation from '../../../../models/Invitation'
import dbConnect from '../../../../utils/dbConnect'
import jwt from 'jsonwebtoken'

export default async function handler(req, res) {
    const { method } = req;

    await dbConnect();

    switch (method) {
        case 'POST':
            try {
                const invitation = await Invitation.findOne({ _id: req.body.invitationId });

                if (!invitation) {
                    res.status(400).json({ success: false });
                    return;
                }

                const userId = req.body.user;
                const pageId = invitation.page;

                //Check if the invitation has expired
                const now = new Date();
                if (invitation.expiration < now) {
                    res.status(400).json({ success: false });
                    await Invitation.deleteOne({ _id: invitation._id });
                    return;
                }

                //First check if the user already has access to this page
                const existingAccess = await UserPageAccess.findOne({ page: pageId, user: userId });
                if (existingAccess) {
                    res.status(400).json({ success: true, data: existingAccess });
                    return;
                }

                console.log("Creating new access");
                console.log("Page: " + pageId);
                console.log("User: " + userId);

                const userPageAccess = await UserPageAccess.create({
                    page: pageId,
                    user: userId,
                    accessLevel: "write"
                });
                res.status(201).json({ success: true, data: userPageAccess });
            } catch (error) {
                res.status(400).json({ success: false, error: error });
            }
            break;
        case 'GET':
            try {
                const token = req.headers.authorization.split(" ")[1];
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                const userId = decoded.user._id;
                const pageId = req.query.pageId;

                const userPageAccess = await UserPageAccess.findOne({ page: pageId, user: userId });

                res.status(200).json({ success: true, data: userPageAccess });
            } catch (error) {
                console.log(error);
                res.status(400).json({ success: false, error: error });
            }
            break;

        default:
            res.status(400).json({ success: false });
            break;
    }
}