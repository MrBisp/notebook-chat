import mixpanel from "mixpanel";
mixpanel.init(process.env.MIXPANEL_TOKEN, {
    host: "api-eu.mixpanel.com",
})