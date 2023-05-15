import dbConnect from "utils/dbConnect";
import User from "models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export default async (req, res) => {
    await dbConnect();

    const {
        method,
        query: { id }
    } = req;

    switch (method) {
        case "PUT":
            console.log('Updating user with id: ' + id);

            try {
                const user = await User.findOne({ "_id": id });

                if (!user) {
                    return res.status(400).json({ success: false, message: "User not found" });
                }
                console.log('User found: ' + user._id);

                //Check if the user are authenticated with this user_id
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                console.log('Decoded user: ' + decoded.user._id)
                console.log('User id: ' + id)

                if (decoded.user._id !== id) {
                    return res.status(401).json({ success: false, message: "You are not authorized to update this user" });
                }

                user.token = req.body.token;

                await user.save();

                console.log('Successfully updated user: ' + user.id)
                res.status(200).json({ success: true, user });
            } catch (error) {
                res.status(400).json({ success: false, message: error.message });
            }
            break;
        default:
            console.log('We only support PUT requests')
            res.status(400).json({ success: false });
            break;
    }
}