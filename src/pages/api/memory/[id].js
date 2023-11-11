import dbConnect from "../../../../utils/dbConnect";
import Memory from "../../../../models/Memory";
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
    const memory = await Memory.findOne({ _id: id });
    if (memory.user.toString() !== decoded.user._id) {
        console.log('User is not the owner of the memory');
        res.status(400).json({ success: false });
    }

    switch (method) {
        case "GET":
            //Get the memory
            res.status(200).json({ success: true, data: memory });
            break;
        case "PUT":
            //Update the memory
            const updatedMemory = await Memory.findOneAndUpdate({ _id: id }, req.body, {
                new: true,
                runValidators: true,
            });
            res.status(200).json({ success: true, data: updatedMemory });
            break;
        case "DELETE":
            //Delete the memory
            const deletedMemory = await Memory.deleteOne({ _id: id });
            res.status(200).json({ success: true, data: deletedMemory });
            break;
        default:
            res.status(400).json({ success: false });
            break;
    }
}