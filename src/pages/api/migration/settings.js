import User from "../../../../models/User"
import Settings from "../../../../models/Settings";
import dbConnect from "utils/dbConnect";


const handler = async (req, res) => {
    await dbConnect();

    const users = await User.find();

    // Loop through each User, their workbooks, and pages
    for (const user of users) {
        // Define the default settings
        const defaultSettings = [
            {
                setting: 'gpt-version',
                value: 'gpt-3.5-turbo',
            }
        ];

        // Loop through each default setting and create a new record
        for (const setting of defaultSettings) {
            const newSetting = new Settings({
                user: user._id,
                setting: setting.setting,
                value: setting.value,
            });

            await newSetting.save();
        }
    }

    console.log('Migration completed');
    res.status(200).json({ success: true });
}

export default handler;