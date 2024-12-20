import dbConnect from "utils/dbConnect";
import User from "models/User";
import bcrypt from "bcrypt";

export default async (req, res) => {
    await dbConnect();

    const { method } = req;

    switch (method) {
        case "GET":
            try {
                const users = await User.find({}); /* find all the data in our database */
                res.status(200).json({ success: true, data: users });
            } catch (error) {
                res.status(400).json({ success: false });
            }
            break;
        case "POST":
            console.log('Creating new user...')
            try {
                let email = req.body.email;
                let password = req.body.password;
                req.body.password = await bcrypt.hash(req.body.password, 10);

                const user = await User.create(
                    req.body
                );

                console.log('User created successfully');
                res.status(201).json({
                    success: true, data: {
                        email,
                        password,
                        id: user._id
                    }
                });
            } catch (error) {
                console.log(error)
                res.status(400).json({ success: false, error: error });
            }
            break;
        default:
            console.log('We only support GET and POST requests')
            res.status(400).json({ success: false });
            break;
    }
};