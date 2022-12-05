import { Send } from 'express-serve-static-core';
export { };


declare global {
    namespace express {
        interface Request {
            body: any;
        }
    }
}

export interface TypedRequestBody<T> extends Express.Request {
    body: T;
    query: T;
    params: T;
}

export interface TypedResponseBody<T> extends Express.Response {
    send: any;
    json: any;
}