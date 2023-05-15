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
        case "DELETE":
            console.log('Deleting conversation with id: ' + conversation_id)
            console.log(req.body);

            try {
                const user = await User.findOne({ "conversations.id": conversation_id });

                if (!user) {
                    return res.status(400).json({ success: false, message: "User not found" });
                }

                //Check if the user are authenticated with this user_id
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);


                if (decoded.user._id !== JSON.parse(req.body).user_id) {
                    return res.status(401).json({ success: false, message: "You are not authorized to delete this conversation" });
                }
                console.log('User found: ' + user._id);

                const conversation = user.conversations.find(conversation => conversation.id === conversation_id);
                if (!conversation) {
                    return res.status(400).json({ success: false, message: "Conversation not found" });
                }
                console.log('Conversation found: ' + conversation.id);

                user.conversations = user.conversations.filter(conversation => conversation.id !== conversation_id);
                await user.save();

                res.status(200).json({ success: true, conversation });
            } catch (error) {
                res.status(400).json({ success: false, message: error.message });
            }

            break;

        case "PUT":
            console.log('Updating conversation with id: ' + conversation_id)

            try {
                const user = await User.findOne({ "conversations.id": conversation_id });

                if (!user) {
                    return res.status(400).json({ success: false, message: "User not found" });
                }

                //Check if the user are authenticated with this user_id
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                if (decoded.user._id !== req.body.user_id.toString()) {
                    return res.status(401).json({ success: false, message: "You are not authorized to update this conversation" });
                }

                const conversation = user.conversations.find(conversation => conversation.id === conversation_id);
                if (!conversation) {
                    return res.status(400).json({ success: false, message: "Conversation not found" });
                }

                const { messages, systemMessage, model, name } = req.body;
                if (messages) {
                    conversation.messages = messages;
                }
                if (systemMessage) {
                    conversation.systemMessage = systemMessage;
                }
                if (model) {
                    conversation.model = model;
                }
                if (name) {
                    conversation.name = name;
                }

                await user.save();

                const updatedConversation = user.conversations.find(conversation => conversation.id === conversation_id);
                console.log('Successfully updated conversation: ' + updatedConversation.id);

                res.status(200).json({ success: true, conversation: updatedConversation });
            } catch (error) {
                res.status(400).json({ success: false, message: error.message });
            }
            break;

        default:
            res.status(400).json({ success: false, message: "Invalid request method" });
            break;
    }

}