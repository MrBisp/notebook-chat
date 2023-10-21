//Can be used in AuthContext

import Mixpanel from 'mixpanel';
let mixpanel = Mixpanel.init('a9e2e77a41dea450495ebed7909beb34', {
    host: "api-eu.mixpanel.com",
})

function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

module.exports = {
    mixpanel,
    generateId
}