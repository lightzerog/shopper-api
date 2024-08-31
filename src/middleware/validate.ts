import { NextFunction, Request, Response } from 'express';

export function validateJSON(err: any, req: Request, res: Response, next: NextFunction): void {
    if (err instanceof SyntaxError && err.message.includes('JSON')) {
        // ERRO DE JSON INVÁLIDO
        res.status(400).json({
            error_code: 'INVALID_JSON',
            error_description: 'INVALID JSON BODY'
        });
    }
}