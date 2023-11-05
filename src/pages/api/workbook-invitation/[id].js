import dbConnect from "utils/dbConnect";
import User from "models/User";
import jwt from "jsonwebtoken";
import WorkbookInvitation from "models/WorkbookInvitation";

const handler = async (req, res) => {
    await dbConnect();

    const { method, query: { id } } = req;

    switch (method) {
        case "GET":
            try {
                // Get the workbook invitation by ID and populate the associated workbook
                const workbookInvitation = await WorkbookInvitation.findById(id).populate('workbook').exec();

                if (!workbookInvitation) {
                    res.status(404).json({ success: false, error: "Invitation not found" });
                    return;
                }

                // Check if the workbook invitation has expired
                if (workbookInvitation.expiration < new Date()) {
                    res.status(400).json({ success: false, error: "Invitation has expired" });
                    return;
                }

                res.status(200).json({ success: true, invitation: workbookInvitation });

            } catch (error) {
                console.log(error);
                res.status(400).json({ success: false, error: "Invalid invitation" });
            }
            break;
        default:
            res.status(400).json({ success: false, message: "We only support GET requests" });
            break;
    }
}

export default handler;
