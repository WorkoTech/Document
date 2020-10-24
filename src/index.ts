// Express
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorhandler = require('errorhandler');

// ShareDB
const WebSocket = require('ws');
const WebSocketJSONStream = require('@teamwork/websocket-json-stream');
const ShareDB = require('sharedb');
const ShareDBMongo = require('sharedb-mongo');
const richText = require('rich-text');
ShareDB.types.register(richText.type);

// Mongo
const MongoClient = require('mongodb').MongoClient;

// Sequelize
const Sequelize = require('sequelize');

import { createDocumentModel } from './models/Document.model';
import {
    devErrorHandler,
    productionErrorHandler,
    notFoundErrorHandler
} from './errors';
import routes from './routes';

const isProduction = process.env.NODE_ENV === 'production';
const app = express();

let connexionTry = 0;
const connectToMongoDB = () => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(
            process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/documents',
            {
                useNewUrlParser: true
            },
            (err, client) => {
                connexionTry += 1
                if (err) {
                    console.log('Try ' + connexionTry + ' : Unable to connect to mongo (' + err.name + '), retrying...')
                    return setTimeout(() => connectToMongoDB().then(resolve).catch(reject), 2000)
                }
                console.log('Successfuly connected to mongo.')
                return resolve(client)
            }
        )
    });
}

let pgConnexionTry = 0;
const initSequelize = () => {
    return new Promise((resolve, reject) => {
        const sequelize = new Sequelize(process.env.PG_URI || 'postgres://postgres:_qWj4gaGs3S3=fyD9H5ke6@7araS@W@127.0.0.1:5432/document');

        return sequelize.authenticate()
            .then(() => {
                console.log('Successfuly connected to PostgreSQL.');
                createDocumentModel(sequelize);

                // TODO: check how handling migrations
                // if (!isProduction) {
                return sequelize.sync().then(() => resolve(sequelize));
                // }
                // return resolve(sequelize)
            })
            .catch(err => {
                console.log('Try ' + pgConnexionTry + ' : Unable to connect to postgres ( ' + err + ', retrying...');
                pgConnexionTry += 1
                return setTimeout(() => initSequelize().then(resolve).catch(reject), 2000);
            });
    });
}

const initExpress = () => {
    const app = express();

    app.use(cors()); // CORS
    app.use(morgan('dev')); // HTTP logs
    app.use(express.json()); // Only accept and parse JSON

    app.use(routes); // Load routes
    app.use(notFoundErrorHandler); // catch 404 and forward to error handler

    // Error handlers
    if (!isProduction) {
        app.use(devErrorHandler);
    }
    app.use(productionErrorHandler);

    return new Promise((resolve, reject) => {
        const http = app.listen(process.env.DOCUMENT_PORT || 3000, () => {
            console.log('Express server listening on '
                + (http.address().address == '::' ? '127.0.0.1' : http.address().address)
                + ':'
                + http.address().port
                + '...'
            );

            resolve({app, http});
        });
    });
}

const initShareDB = (express, db) => {
    const adapter = ShareDBMongo({mongo: fn => fn(null, db) });

    const backend = new ShareDB({
        db: adapter,
        disableDocAction: true,
        disableSpaceDelimitedActions: true
    });
    const connection = backend.connect();
    express.app.set('shareDbConnection', connection);

    const wss = new WebSocket.Server({ server: express.http });
    console.log('Starting ShareDB backend...');
    wss.on("connection", (ws, req) => {
        console.log('User connected on editor');
        const stream = new WebSocketJSONStream(ws);
        backend.listen(stream);
    });
}

initSequelize().then(sequelize => {
    connectToMongoDB().then(db => {
        initExpress().then((express: any) => {
            initShareDB(express, db);
        })
    })
}).catch(err =>
    console.error("An error occured : ", err)
);
