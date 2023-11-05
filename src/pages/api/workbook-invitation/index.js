import dbConnect from "utils/dbConnect";
import User from "models/User";
import jwt from "jsonwebtoken";
import WorkbookInvitation from "../../../../models/WorkbookInvitation";
import UserWorkbookAccess from "../../../../models/UserWorkbookAccess";

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

                // Check if the user is the owner of the workbook they're trying to share
                const userAccess = await UserWorkbookAccess.findOne({
                    user: decoded.user._id,
                    workbook: req.body.workbookId
                }).exec();

                if (!userAccess || userAccess.accessLevel !== 'owner') {
                    res.status(403).json({ success: false, error: "You don't have permission to share this workbook." });
                    return;
                }

                // First, check if the user already has made an invitation to that workbook
                const existingInvitation = await WorkbookInvitation.findOne({
                    user: decoded.user._id,
                    workbook: req.body.workbookId
                }).exec();

                if (existingInvitation && existingInvitation.expiration > new Date()) {
                    res.status(400).json({ success: true, link: `${process.env.HOME_URL}/accept-notebook-invitation/${existingInvitation._id}` });
                    return;
                }

                if (existingInvitation && existingInvitation.expiration < new Date()) {
                    await existingInvitation.delete();
                }

                const workbookInvitation = new WorkbookInvitation({
                    user: decoded.user._id,
                    workbook: req.body.workbookId,
                    expiration: req.body.expiration
                });
                await workbookInvitation.save();

                // Now, create a link that the user can use to accept the workbook invitation
                const link = `${process.env.HOME_URL}/accept-workbook-invitation/${workbookInvitation._id}`;

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
