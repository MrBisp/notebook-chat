import dbConnect from "utils/dbConnect";
import User from "models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const handler = async (req, res) => {
    await dbConnect();

    const { method } = req;

    switch (method) {
        case "POST":
            console.log('Trying to login')
            try {
                // Check if there exists a user with the same email and password
                const user = await User.findOne({
                    email: req.body.email
                });

                if (!user) {
                    console.log('User not found')
                    return res.status(401).json({ success: false, message: 'User not found' });
                }

                //Check for password
                const match = await bcrypt.compare(req.body.password, user.password);
                if (match) {
                    const authToken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });
                    console.log('Successfully logged in');
                    res.status(200).json({ user: { id: user.id, email: user.email, conversations: user.conversations }, authToken });
                } else {
                    res.status(401).json({ success: false, message: 'Incorrect password' });
                }
            } catch (error) {
                console.log(error)
                res.status(400).json({ success: false, message: error.message });
            }
            break;
        default:
            res.status(400).json({ success: false, message: "We only support POST requests" });
            break;
    }
};

export default handler;