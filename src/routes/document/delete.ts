const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

import {
    fetchDoc,
    validate,
    fetchUserWorkspacePermission,
    haveWriteAccess,
    notifyUsers,
    sendBillingEvent,
    BillingEvent,
    sendGamificationEvent
} from '../../utils';
import { HttpError } from '../../errors';
import { Document } from '../../models/Document.model';


// ROUTE DELETE /document/{id}
router.delete(
    '/:documentId',
    (req, res, next) => {
        // EXTRACT JWT
        const rawToken = req.header('Authorization') || '';
        const splitedToken = rawToken.split(' ').map(x => x.trim())
        if (splitedToken.length < 2) {
            next(new HttpError(401, 'Unauthorized'));
            return;
        }
        const token = jwt.decode(splitedToken[1]);

        // VALIDATE REQUEST
        if (!validate(req)) {
            next(new HttpError(400, 'Invalid request'));
            return;
        }

        const documentId = req.param('documentId');
        Document.findByPk(documentId).then(
            document =>
                fetchUserWorkspacePermission(
                    rawToken,
                    document.workspaceId
                ).then(
                    permission => {
                        console.log('In then permission');
                        if (!haveWriteAccess(permission)) {
                            throw new HttpError(403, 'Forbidden');
                        }
                    }
                ).then(
                    () => document
                )
        ).then(
            document => {
                // SEND BILLING EVENT THAT A DOCUMENT HAS BEEN DELETED
                sendBillingEvent(rawToken, BillingEvent.WORKSPACE_DOCUMENT_DELETED, document.workspaceId);
                return document;
            }
        ).then(
            document => {
                // SEND GAMIFICATION EVENT THAT A DOCUMENT HAS BEEN CREATED
                sendGamificationEvent(rawToken, false);
                return document;
            }
        ).then(
            document => {
                // SEND DELETED DOCUMENT ON SOCKET IO WORKSPACE ROOM
                notifyUsers(document.workspaceId, 'document deleted', document)
                return document;
            }
        ).then(
            document => {
                document.destroy()
                res.status(204).end()
            }
        ).catch(err => {
            if (err instanceof HttpError) {
                next(err);
            } else {
                // UNEXPECTED ERROR
                console.error('Unexpected error : ', err);
                next(new HttpError(500, 'Internal Server Error'));
            }
        });
});

export default router;
