import dbConnect from "../../../../utils/dbConnect";
import Settings from "../../../../models/settings";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
    const { method } = req;
    await dbConnect();


    //Let's first decode the token
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    //Let's check if the user is the same as the one in the token
    if (!decoded.user) {
        res.status(400).json({ success: false });
    }

    switch (method) {
        case "GET":
            //Get all settings for the user
            const settings = await Settings.find({ user: decoded.user._id });
            res.status(200).json({ success: true, data: settings });
            break;
        case "POST":
            //Create a new setting, and get its id
            const newSetting = new Settings({
                user: decoded.user._id,
                setting: req.body.setting,
                value: req.body.value,
            });
            const setting = await newSetting.save();
            res.status(201).json({ success: true, data: setting });
            break;
        default:
            res.status(400).json({ success: false });
            break;
    }
}