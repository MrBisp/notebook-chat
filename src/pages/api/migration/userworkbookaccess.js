import User from "../../../../models/User"
import { Workbook } from "../../../../models/Workbook"
import UserWorkbookAccess from "../../../../models/UserWorkbookAccess"
import dbConnect from '../../../../utils/dbConnect';

async function handler(req, res) {
    await dbConnect();

    try {
        // Fetch all users
        const users = await User.find({})

        for (let user of users) {
            // Filter out workbooks that do not exist
            const validWorkbooks = [];
            for (let workbookId of user.workbooks) {
                const workbookExists = await Workbook.findById(workbookId);
                if (workbookExists) {
                    validWorkbooks.push(workbookId);
                }
            }

            // Update the user's workbooks with valid ones
            user.workbooks = validWorkbooks;
            await user.save();

            // Now, proceed with the original migration logic
            for (let workbookId of user.workbooks) {
                // Check if there's already an entry in UserWorkbookAccess for this user-workbook combo
                const existingAccess = await UserWorkbookAccess.findOne({ user: user._id, workbook: workbookId });

                if (!existingAccess) {
                    // If not, create a new entry with 'owner' access level
                    const newAccess = new UserWorkbookAccess({
                        user: user._id,
                        workbook: workbookId,
                        accessLevel: 'owner'
                    });

                    await newAccess.save();
                }
            }
        }

        console.log("Migration completed!");
        res.status(200).json({ success: true, message: "Migration completed!" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

export default handler;
