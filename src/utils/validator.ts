const express = require('express');
const { validationResult } = require('express-validator');

export const validate = (request) => {
    return validationResult(request).isEmpty()
}
