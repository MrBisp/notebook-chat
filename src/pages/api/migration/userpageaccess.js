import User from "../../../../models/User"
import { Page, Workbook } from "../../../../models/Workbook"
import UserPageAccess from "../../../../models/UserPageAccess"
import dbConnect from "utils/dbConnect";


const handler = async (req, res) => {
    await dbConnect();

    const users = await User.find({})
        .populate({
            path: 'workbooks',
            populate: { path: 'pages' }
        });

    // Loop through each User, their workbooks, and pages
    for (const user of users) {
        for (const workbook of user.workbooks) {
            for (const page of workbook.pages) {
                // Define the access level, in this example, we'll use 'edit'
                const accessLevel = 'owner';

                // Create the UserPageAccess record
                const newUserPageAccess = new UserPageAccess({
                    user: user._id,
                    page: page._id,
                    accessLevel: accessLevel,
                });

                await newUserPageAccess.save();
            }
        }
    }

    console.log('Migration completed');
    res.status(200).json({ success: true });
}

export default handler;