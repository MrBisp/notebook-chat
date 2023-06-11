import dbConnect from "utils/dbConnect";
import User from "models/User";
import { Workbook } from "models/Workbook";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export default async (req, res) => {
    await dbConnect();

    const { method } = req;

    switch (method) {
        case "POST":
            try {
                console.log(req.body);
                let title = req.body.title;
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

                const user = await User.findOne({ _id: decoded.user._id });

                const newWorkbook = new Workbook({
                    title: title
                });

                await newWorkbook.save();

                user.workbooks.push(newWorkbook._id);

                await user.save();

                console.log('Successfully created new workbook')
                res.status(200).json({ success: true, workbook: newWorkbook });
            } catch (error) {
                console.log(error)
                res.status(400).json({ success: false, error: error });
            }

            break;
        default:
            console.log('We only support POST requests')
            res.status(400).json({ success: false });
            break;
    }
}