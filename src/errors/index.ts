export class HttpError extends Error{
    code: number;

    constructor(code: number, message?: string) {
        super(message);
        this.code = code;
    }
};

export const notFoundErrorHandler = (req, res, next) => {
    const err = new HttpError(404, 'Not found');
    next(err);
};

export const devErrorHandler = (err: HttpError, req: any, res: any, next: Function) => {
    console.error(err.stack);

    res.status(err.code || 500);
    res.json(buildErrorJsonResponse(err.message, err));
}

export const productionErrorHandler = (err: HttpError, req: any, res: any, next: Function) => {
    res.status(err.code || 500);
    res.json(buildErrorJsonResponse(err.message, {}));
}

const buildErrorJsonResponse = (message: string, error: any) => ({
    'error': {
        message,
        'code' :error.code
    }
})
