const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
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

const MONGO_COLLECTION: string = 'document';

interface DocumentResponse {
    id: number
}

const createShareDbDocument = (shareDb, id): Promise<void | DocumentResponse> => {
    const document = shareDb.get(MONGO_COLLECTION, `${id}`);

    return fetchDoc(document).then(doc => {
        if (doc.type === null) {
            doc.create(
                [{insert: ''}],
                'rich-text',
                () => {
                    return {
                        id
                    };
                }
            );
        } else {
            throw 'Document already created'
        }
    });
}

// ROUTE POST /document
router.post(
    '/',
    [
        body('title').exists().trim(),
        body('workspaceId').exists().isNumeric()
    ],
    (req, res, next) => {
        const shareDbConnection = req.app.get('shareDbConnection');

        // EXTRACT JWT
        const rawToken = req.header('Authorization') || '';
        const splitedToken = rawToken.split(' ').map(x => x.trim())
        if (splitedToken.length < 2) {
            next(new HttpError(403, 'Forbidden'));
            return;
        }
        const token = jwt.decode(splitedToken[1]);

        // VALIDATE REQUEST
        if (!validate(req)) {
            next(new HttpError(400, 'Invalid request'));
            return;
        }

        // CHECK USER PERM ON WORKSPACE
        const document = req.body;
        fetchUserWorkspacePermission(
            rawToken,
            req.body.workspaceId
        ).then(
            permission => {
                if (!haveWriteAccess(permission)) {
                    next(new HttpError(401, 'Unauthorized'));
                    return;
                }
                // CREATE DOCUMENT
                document.authorId = token.userId;
                return Document.create(document).catch(err => {
                    throw new HttpError(400, err.original.detail);
                });
            }
        ).then(
            document => {
                // Create SHAREDB DOCUMENT
                return createShareDbDocument(shareDbConnection, document.id)
                    .then(() => document);
            }
        ).then(
            document => {
                // SEND BILLING EVENT THAT A DOCUMENT HAS BEEN CREATED
                sendBillingEvent(rawToken, BillingEvent.WORKSPACE_DOCUMENT_CREATED, document.workspaceId);
                return document;
            }
        ).then(
            document => {
                // SEND GAMIFICATION EVENT THAT A DOCUMENT HAS BEEN CREATED
                sendGamificationEvent(rawToken, true);
                return document;
            }
        ).then(
            document => {
                // SEND CREATED DOCUMENT ON SOCKET IO WORKSPACE ROOM
                notifyUsers(document.workspaceId, 'document created', document)
                return document;
            }
        ).then(
            document => {
                // HTTP RESPONSE
                res.status(200).json(document);
                return document;
            }
        ).catch(err => {
            if (err instanceof HttpError) {
                next(err);
            } else {
                console.log('error : ', err);
                // UNEXPECTED ERROR
                next(new HttpError(500, 'Internal Server Error'));
            }
        });
});

export default router;
