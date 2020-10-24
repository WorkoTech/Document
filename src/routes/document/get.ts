const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

import {
    fetchDoc,
    validate,
    fetchUserWorkspacePermission,
    haveReadAccess,
    notifyUsers
} from '../../utils';
import { HttpError } from '../../errors';

import { Document } from '../../models/Document.model';

const MONGO_COLLECTION: string = 'document';

// ROUTE GET /document
router.get(
    '/',
    [
        query('workspace').exists().isNumeric(),
    ],
    (req, res, next) => {
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
        fetchUserWorkspacePermission(
            rawToken,
            req.query.workspace
        ).then(
            permission => {
                console.log('In then permission');
                if (!haveReadAccess(permission)) {
                    throw new HttpError(401, 'Unauthorized');
                }
            }
        ).then(
            () => {
                console.log('In then request');
                // GET WORKSPACE DOCUMENTS
                return Document.findAll({
                    where: {
                        workspaceId: req.query.workspace
                    }
                })
            }
        ).then(
            documents => {
                // HTTP RESPONSE
                res.status(200).json(documents);
            }
        )
        .catch(err => {
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
