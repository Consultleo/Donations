// Authentication middleware

// Check if user is logged in
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/login');
}

// Check if user is an admin
function requireAdmin(req, res, next) {
    if (req.session && req.session.userId && req.session.role === 'admin') {
        return next();
    }
    res.status(403).send('Access denied. Admin only.');
}

// Redirect to dashboard if already logged in
function redirectIfAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        return res.redirect('/me');
    }
    next();
}

module.exports = {
    requireAuth,
    requireAdmin,
    redirectIfAuthenticated
};
