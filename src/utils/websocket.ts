const axios = require('axios');

export const notifyUsers = (workspaceId: string, event: string, message: any): Promise<void> => {
    const channel =  `workspace ${workspaceId}`

    const url = `http://${process.env.NOTIFIER_HOST}:${process.env.NOTIFIER_PORT}/notify`;

    return axios.post(url, {
        channel,
        event,
        data: message
    }, {
        timeout: 1000
    }).catch(err => {
        console.log('An error occured while notifying users : ', err.code);
    });
}
