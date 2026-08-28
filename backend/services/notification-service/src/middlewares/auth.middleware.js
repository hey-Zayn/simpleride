import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authorization token missing or malformed' });
    }
    try {
        req.user = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
        return next();
    } catch {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};