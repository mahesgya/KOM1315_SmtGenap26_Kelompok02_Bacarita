export interface ErrorPayload {
    success: false;
    statusCode: number;
    error: string;
}

export interface SuccessPayload{
    success: true;
    statusCode: number;
    message: string;
}

export interface BadRequestErrorPayload extends ErrorPayload {
    errors: string[];
}