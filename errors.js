export class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = "ApiError"
        this.status = status
    }

    get isNotFound() {
        return this.status === 404;
    }

    get isRetryable() {
        return this.status >= 500
    }
}