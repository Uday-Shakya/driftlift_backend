const jwt = require('jsonwebtoken');

function checkAuth(req, res, next) {
    let authToken = req.cookies?.authToken;
    let refreshToken = req.cookies?.refreshToken;

    // Authorization header fallback for cross-site / third-party cookie restrictions
    if (!authToken && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        authToken = req.headers.authorization.split(' ')[1];
    }
    if (!refreshToken && req.headers['x-refresh-token']) {
        refreshToken = req.headers['x-refresh-token'];
    }

    if (!authToken && !refreshToken) {
        return res.status(401).json({ message: 'Authentication failed: No authToken or refreshToken provided', ok: false });
    }

    if (authToken) {
        jwt.verify(authToken, process.env.JWT_SECRET_KEY, (err, decoded) => {
            if (!err && decoded) {
                req.userId = decoded.userId;
                req.ok = true;
                return next();
            }

            // Auth token has expired, check the refresh token if available
            if (refreshToken) {
                const refreshSecret = process.env.JWT_REFRESH_SECRET_KEY || process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET_KEY;
                jwt.verify(refreshToken, refreshSecret, (refreshErr, refreshDecoded) => {
                    if (refreshErr || !refreshDecoded) {
                        return res.status(401).json({ message: 'Authentication failed: Both tokens are invalid', ok: false });
                    }

                    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';
                    const cookieOptions = {
                        httpOnly: true,
                        secure: isHttps,
                        sameSite: isHttps ? 'none' : 'lax',
                        maxAge: 7 * 24 * 60 * 60 * 1000
                    };

                    const newAuthToken = jwt.sign({ userId: refreshDecoded.userId }, process.env.JWT_SECRET_KEY, { expiresIn: '50m' });
                    const newRefreshToken = jwt.sign({ userId: refreshDecoded.userId }, refreshSecret, { expiresIn: '10d' });

                    res.cookie('authToken', newAuthToken, cookieOptions);
                    res.cookie('refreshToken', newRefreshToken, cookieOptions);
                    res.setHeader('x-new-authtoken', newAuthToken);

                    req.userId = refreshDecoded.userId;
                    req.ok = true;
                    return next();
                });
            } else {
                return res.status(401).json({ message: 'Authentication failed: Token expired', ok: false });
            }
        });
    } else {
        // Only refresh token was provided
        const refreshSecret = process.env.JWT_REFRESH_SECRET_KEY || process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET_KEY;
        jwt.verify(refreshToken, refreshSecret, (refreshErr, refreshDecoded) => {
            if (refreshErr || !refreshDecoded) {
                return res.status(401).json({ message: 'Authentication failed: Invalid refresh token', ok: false });
            }
            req.userId = refreshDecoded.userId;
            req.ok = true;
            next();
        });
    }
}

module.exports = checkAuth;
