import dbConnect from "../../../../utils/dbConnect";
import Settings from "../../../../models/settings";
import jwt from "jsonwebtoken";

export default async function POST(req, res) {
    const {
        method, query: { id }
    } = req;

    await dbConnect();

    //Let's first decode the token
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    //Let's check if the setting with id belongs to the user
    const setting = await Settings.findOne({ _id: id });
    if (setting.user.toString() !== decoded.user._id) {
        console.log('User is not the owner of the setting');
        res.status(400).json({ success: false });
    }

    switch (method) {
        case "GET":
            //Get the setting
            res.status(200).json({ success: true, data: setting });
            break;
        case "PUT":
            //Update the setting
            const updatedSetting = await Settings.findOneAndUpdate({ _id: id }, req.body, {
                new: true,
                runValidators: true,
            });
            res.status(200).json({ success: true, data: updatedSetting });
            break;
        case "DELETE":
            //Delete the setting
            const deletedSetting = await Settings.deleteOne({ _id: id });
            res.status(200).json({ success: true, data: deletedSetting });
            break;
        default:
            res.status(400).json({ success: false });
            break;
    }
}