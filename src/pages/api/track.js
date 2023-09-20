export default async (req, res) => {
    const projektToken = process.env.MIXPANEL_PROJECT_TOKEN;
    const eventProperties = req.body.eventProperties || {};

    if (!projektToken) {
        res.status(200).json({ message: 'No Mixpanel project token' });
        return;
    }

    const generateId = () => {
        return Math.round(Math.random() * 1000000000000000).toString();
    }

    //POST Request
    const options = {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'authorization': 'Basic ' + process.env.MIXPANEL_BASIC_AUTH
        },
        body: JSON.stringify([{
            event: req.body.eventName,
            properties: {
                time: new Date().getTime(),
                token: projektToken,
                distinct_id: req.body.distinctId || generateId(),
                $insert_id: generateId(),
                ...eventProperties
            }
        }])
    }



    const response = await fetch('https://api.mixpanel.com/import?strict=1&project_id=' + process.env.MIXPANEL_PROJECT_ID, options)
        .then(res => res.json())
        .then(json => {
            console.log('trackEvent response', json);
            return json;
        })
        .catch(error => {
            console.log('trackEvent error', error);
            res.status(500).json({ message: 'Something went wrong' });
            return error;
        })

    res.status(200).json({ message: 'Event tracked' });
}