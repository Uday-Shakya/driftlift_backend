const jwt = require('jsonwebtoken');

function checkAdminToken(req, res, next) {
    let adminAuthToken = req.cookies?.adminAuthToken;

    if (!adminAuthToken && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        adminAuthToken = req.headers.authorization.split(' ')[1];
    }

    if (!adminAuthToken) {
        return res.status(401).json({ message: 'Admin authentication failed: No adminAuthToken provided', ok: false });
    }

    jwt.verify(adminAuthToken, process.env.JWT_ADMIN_SECRET_KEY, (err, decoded) => {
        if (err || !decoded) {
            return res.status(401).json({ message: 'Admin authentication failed: Invalid adminAuthToken', ok: false });
        } else {
            req.adminId = decoded.adminId;
            next();
        }
    });
}

module.exports = checkAdminToken;
