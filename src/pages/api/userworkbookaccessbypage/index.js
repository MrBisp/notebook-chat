import jwt from 'jsonwebtoken';
import dbConnect from '../../../../utils/dbConnect';
import { Page, Workbook } from '../../../../models/Workbook';
import UserWorkbookAccess from '../../../../models/UserWorkbookAccess';


const handler = async (req, res) => {
    await dbConnect();

    const { method } = req;

    switch (method) {
        case "POST":
            try {
                const pageId = req.body.pageId;
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

                // Find which workbook the page belongs to
                const page = await Page.findById(pageId);
                const workbook = await Workbook.findOne({ pages: pageId });

                if (!workbook) {
                    return res.status(404).json({ success: false, message: 'Workbook not found for the given page' });
                }

                // Check the user's access to the workbook
                const accessEntry = await UserWorkbookAccess.findOne({ user: decoded.user._id, workbook: workbook._id });

                if (!accessEntry) {
                    return res.status(403).json({ success: false, message: 'Access denied' });
                }

                res.status(200).json({ success: true, data: { accessLevel: accessEntry.accessLevel } });

            } catch (error) {
                console.log(error);
                res.status(400).json({ success: false, message: "Something went wrong..." });
            }
            break;
        default:
            res.status(400).json({ success: false, message: "We only support GET requests" });
            break;
    }
};

export default handler;