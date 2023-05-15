// pages/api/conversations/[id].js
import dbConnect from "utils/dbConnect";
import User from "models/User";
import jwt from "jsonwebtoken";

dbConnect();

export default async function handler(req, res) {
    console.log('Request method: ' + req.method);

    const {
        query: { conversation_id },
        method,
    } = req;

    switch (method) {
        case "POST":
            console.log('Posting message to conversation with id: ' + conversation_id)
            console.log(req.body);

            try {
                const user = await User.findOne({ "conversations.id": conversation_id });

                if (!user) {
                    return res.status(400).json({ success: false, message: "User not found" });
                }
                console.log('User: ' + user._id);

                //Check if the user are authenticated with this user_id
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                console.log('Decoded user: ' + decoded.user._id)
                console.log('User id: ' + user.id)

                if (decoded.user._id !== user.id) {
                    return res.status(401).json({ success: false, message: "You are not authorized to create new messages in this conversation" });
                }
                console.log('User found: ' + user._id);

                const conversation = user.conversations.find(conversation => conversation.id === conversation_id);
                if (!conversation) {
                    return res.status(400).json({ success: false, message: "Conversation not found" });
                }
                console.log('Conversation found: ' + conversation.id);

                const message = {
                    id: (conversation.messages.length + 1).toString() + '-' + new Date().getTime().toString(),
                    role: req.body.role,
                    content: req.body.content
                }

                conversation.messages.push(message);

                await user.save();

                console.log('Successfully added message to conversation: ' + conversation.id)
                res.status(200).json({ success: true, conversation });
            } catch (error) {
                res.status(400).json({ success: false, message: error.message });
            }
            break;
        default:
            res.status(400).json({ success: false, message: "We only support POST requests" });
            break;
    }
}