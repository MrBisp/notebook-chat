import dbConnect from "utils/dbConnect";
import User from "models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Invitation from "models/Invitation";

const handler = async (req, res) => {
    await dbConnect();

    const { method } = req;

    switch (method) {
        case "POST":
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

                if (!decoded) {
                    res.status(401).json({ success: false, error: "Invalid token" });
                    return;
                }

                //First check if the user already has made an invitation to that page
                const existingInvitation = await Invitation.findOne({
                    user: decoded.user._id,
                    page: req.body.pageId
                }).exec();

                if (existingInvitation && existingInvitation.expiration > new Date()) {
                    res.status(400).json({ success: true, link: `${process.env.HOME_URL}/accept-invitation/${existingInvitation._id}` });
                    return;
                }

                if (existingInvitation && existingInvitation.expiration < new Date()) {
                    await Invitation.deleteOne({ _id: existingInvitation._id });
                }

                const invitation = new Invitation({
                    user: decoded.user._id,
                    page: req.body.pageId,
                    expiration: req.body.expiration
                });
                await invitation.save();

                //Now, let's make a link that the user can use to accept the invitation
                const link = `${process.env.HOME_URL}/accept-invitation/${invitation._id}`;

                res.status(200).json({ success: true, link: link });
            } catch (error) {
                console.log(error);
                res.status(400).json({ success: false, error: error });
            }
            break;
        default:
            res.status(400).json({ success: false, message: "We only support POST requests" });
            break;
    }
}

export default handler;