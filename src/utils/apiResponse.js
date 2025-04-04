export const sendResponse = (res, statusCode, message, data = null, meta = null) => {
    res.status(statusCode).json({
        status: statusCode < 400 ? "success" : "error",
        statusCode,
        message,
        data,
        meta,
    });
};