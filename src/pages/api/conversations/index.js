// pages/api/conversations/[id].js
import dbConnect from "utils/dbConnect";
import User from "models/User";
import jwt from "jsonwebtoken";

dbConnect();

export default async function handler(req, res) {
    const {
        query: { user_id },
        method,
    } = req;

    switch (method) {
        case "POST":
            console.log('Adding conversation for user with id: ' + user_id)

            try {
                const user = await User.findById(user_id);

                if (!user) {
                    return res.status(400).json({ success: false, message: "User not found" });
                }

                //Check if the user are authenticated with this user_id
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                if (decoded.user._id !== user_id) {
                    return res.status(401).json({ success: false, message: "You are not authorized to add a conversation to this user" });
                }

                const newConversation = {
                    id: "convo-" + Math.random().toString(36).substr(2, 9),
                    messages: [],
                    systemMessage: "You are an awesome chatbot! Try to be as helpful as possible to the user.",
                    model: "gpt-3.5-turbo",
                    name: "New Conversation"
                };

                user.conversations.push(newConversation);
                await user.save();

                res.status(200).json({ success: true, conversation: newConversation });
            } catch (error) {
                res.status(400).json({ success: false, message: error.message });
            }
            break;

        default:
            res.status(400).json({ success: false });
            break;
    }
}
