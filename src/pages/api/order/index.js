import dbConnect from "utils/dbConnect";
import Order from "models/Order";
import jwt from "jsonwebtoken";

export default async (req, res) => {
    await dbConnect();

    const { method } = req;

    switch (method) {
        case "POST":
            console.log('Creating new order...')

            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

                if (!decoded?.user) {
                    res.status(401).json({ success: false });
                }

                //Create a new order
                const newOrder = new Order({
                    userid: decoded.user._id,
                    date: new Date(),
                    tokens: req.body.tokens,
                    type: req.body.type
                });

                await newOrder.save();

                res.status(200).json({ success: true, order: newOrder });

            } catch (error) {
                console.log(error)
                res.status(400).json({ success: false });
            }

            break;
        default:
            console.log('We only support POST requests')
            res.status(400).json({ success: false });
            break;
    }

}