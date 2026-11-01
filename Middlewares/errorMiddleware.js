function errorHandler(err, req, res, next) {
    console.error(err.stack || err);

    if (res.headersSent) {
        return next(err);
    }
    
    const statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
    res.status(statusCode).json({
        ok: false,
        message: err.message || 'Internal Server Error',
    });
}

module.exports = errorHandler;