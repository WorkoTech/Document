const axios = require("axios");

import { HttpError } from '../errors';


export enum WorkspacePermission {
    CREATOR = "CREATOR",
    USER = "USER",
    REFERENT = "REFERENT",
    NONE = "NONE"
}

export const fetchUserWorkspacePermission = (token: string, workspaceId: number): Promise<WorkspacePermission> => {
    console.log('sending token : ', token);

    return axios.get(`http://${process.env.IAM_HOST}:${process.env.IAM_PORT}/permission/workspace/${workspaceId}`, {
        headers: {
            'Authorization': token
        }
    }).then(response => {
        console.log('Got response : ', response.data);

        return WorkspacePermission[response.data.accessLevel];
    }).catch(err => {
        throw new HttpError(400, 'Unable to get workspace permissions');
    });
}


export const haveWriteAccess = (permission: WorkspacePermission): boolean => {
    return [WorkspacePermission.CREATOR, WorkspacePermission.USER].includes(permission);
}

export const haveReadAccess = (permission: WorkspacePermission): boolean => {
    return permission != WorkspacePermission.NONE;
}
