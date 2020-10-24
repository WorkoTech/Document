const express = require('express');
const router = express.Router();

import create from './create';
import get from './get';
import deleteDocument from './delete'

router.use('/document', create);
router.use('/document', get);
router.use('/document', deleteDocument);

export default router;
