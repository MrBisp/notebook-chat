import UserWorkbookAccess from '../../../../models/UserWorkbookAccess'
import WorkbookInvitation from '../../../../models/WorkbookInvitation'
import dbConnect from '../../../../utils/dbConnect'
import jwt from 'jsonwebtoken'

export default async function handler(req, res) {
    const { method } = req;

    await dbConnect();

    switch (method) {
        case 'POST':
            try {
                const workbookInvitation = await WorkbookInvitation.findOne({ _id: req.body.invitationId });

                if (!workbookInvitation) {
                    res.status(400).json({ success: false });
                    return;
                }

                const userId = req.body.user;
                const workbookId = workbookInvitation.workbook;

                // Check if the invitation has expired
                const now = new Date();
                if (workbookInvitation.expiration < now) {
                    res.status(400).json({ success: false });
                    await WorkbookInvitation.deleteOne({ _id: workbookInvitation._id });
                    return;
                }

                // First check if the user already has access to this workbook
                const existingAccess = await UserWorkbookAccess.findOne({ workbook: workbookId, user: userId });
                if (existingAccess) {
                    res.status(400).json({ success: true, data: existingAccess });
                    return;
                }

                console.log("Creating new access");
                console.log("Workbook: " + workbookId);
                console.log("User: " + userId);

                const userWorkbookAccess = await UserWorkbookAccess.create({
                    workbook: workbookId,
                    user: userId,
                    accessLevel: "write"
                });
                res.status(201).json({ success: true, data: userWorkbookAccess });
            } catch (error) {
                console.log(error);
                res.status(400).json({ success: false, error: error });
            }
            break;
        case 'GET':
            try {
                const token = req.headers.authorization.split(" ")[1];
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                const userId = decoded.user._id;
                const workbookId = req.query.workbookId;

                const userWorkbookAccess = await UserWorkbookAccess.findOne({ workbook: workbookId, user: userId });

                res.status(200).json({ success: true, data: userWorkbookAccess });
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