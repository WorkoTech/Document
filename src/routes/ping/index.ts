import express = require('express');
import * as config from '../../config';

import { Document } from '../../models/Document.model';
import { fetchDoc } from '../../utils';
import { HttpError } from '../../errors';

const router = express.Router();

const MONGO_COLLECTION: string = 'document';


router.get('/', (req, res, next) => {
    const shareDb = req.app.get('shareDbConnection');
    const document = shareDb.get(MONGO_COLLECTION, 1);

    Document.findAll()
        .then(
            () => {
                const mongoAdmin = shareDb.agent.backend.db.mongo.admin()

                return new Promise((resolve, reject) => {
                    mongoAdmin.ping((err, pingResulg) => {
                        if (err)
                            reject(err)
                        resolve(reject)
                    })
                })
            }
        )
        .then(() => res.send({
                name: config.APP_NAME,
                version: config.APP_VERSION,
                date: new Date().toString()
            })
        ).catch(err => {
            console.error('Error occured on /ping : ', JSON.stringify(err))
            next(new HttpError(500, 'Internal Server Error'))
        })
});

export default router;
