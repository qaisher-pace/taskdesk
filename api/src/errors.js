export class HttpError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export const notFound = (what) => new HttpError(404, `${what} not found`);
export const unauthorized = () => new HttpError(401, 'Unauthorized');
export const forbidden = () => new HttpError(403, 'Forbidden');
