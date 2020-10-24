const axios = require('axios');


export const sendGamificationEvent = (
    token: string,
    done: boolean
): Promise<void> => {
    let url = `http://${process.env.GAMIFICATION_HOST}:${process.env.GAMIFICATION_PORT}/action/`;
    if (done) {
        url = url + 'done'
    } else {
        url = url + 'undone'
    }

    return axios.post(
        url,
        {
            actionTitle: 'Documents created'
        },
        {
            headers : {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            timeout: 1000
        }
    ).catch(err => {
        console.log('An error occured while sending gamification event : ', err);
    });
}
