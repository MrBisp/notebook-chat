import dbConnect from "../../../../utils/dbConnect";
import Memory from "../../../../models/Memory";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
    const { method } = req;
    await dbConnect();
    switch (method) {
        case "POST":
            try {
                //Verify the token
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

                if (decoded.user._id !== req.body.user) {
                    res.status(400).json({ success: false });
                }

                //Create a new memory, and get its id
                const newMemory = new Memory({
                    user: req.body.user,
                    memory: req.body.memory,
                    importance: req.body.importance,
                });
                const memory = await newMemory.save();
                res.status(201).json({ success: true, data: memory });
            } catch (error) {
                res.status(400).json({ success: false });
            }
            break;
        case "GET":
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

                if (!decoded.user._id) {
                    console.log('no user id')
                    res.status(400).json({ success: false });
                }

                //Find all memories for the user
                const memories = await Memory.find({ user: decoded.user._id });

                res.status(200).json({ success: true, data: memories });
            } catch (error) {
                console.log(error);
                res.status(400).json({ success: false });
            }
            break;
        default:
            res.status(400).json({ success: false });
            break;
    }
}