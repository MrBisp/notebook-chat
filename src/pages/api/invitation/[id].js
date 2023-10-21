import dbConnect from "utils/dbConnect";
import User from "models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Invitation from "models/Invitation";

const handler = async (req, res) => {
    await dbConnect();

    const { method, query: { id } } = req;

    switch (method) {
        case "GET":
            try {
                //Get the invitation with id and populate the user and page
                const invitation = await Invitation.findById(id).populate('page').exec();

                if (!invitation) {
                    res.status(404).json({ success: false, error: "Invitation not found" });
                    return;
                }

                //Check if the invitation has expired
                if (invitation.expiration < new Date()) {
                    res.status(400).json({ success: false, error: "Invitation has expired" });
                    return;
                }

                res.status(200).json({ success: true, invitation: invitation });

            } catch (error) {
                res.status(400).json({ success: false, error: "Invalid invitation" });
            }
            break;
        default:
            res.status(400).json({ success: false, message: "We only support GET requests" });
            break;
    }
}

export default handler;