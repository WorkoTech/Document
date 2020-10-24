import express = require('express');
import ping from './ping';
import document from './document';

const router = express.Router();

router.use('/ping', ping);
router.use('/', document);

export default router;
