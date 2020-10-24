const axios = require('axios');


export enum BillingEvent {
    WORKSPACE_DOCUMENT_CREATED = 'WORKSPACE_DOCUMENT_CREATED',
    WORKSPACE_DOCUMENT_DELETED = 'WORKSPACE_DOCUMENT_DELETED'
}

export const sendBillingEvent = (
    token: string,
    event: BillingEvent,
    workspaceId: number
): Promise<void> => {
    const url = `http://${process.env.BILLING_HOST}:${process.env.BILLING_PORT}/billing/event`;

    return axios.post(
        url,
        {
            type: event,
            workspaceId
        },
        {
            headers : {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            timeout: 1000
        }
    ).catch(err => {
        console.log('An error occured while sending billing event : ', err);
    });
}
