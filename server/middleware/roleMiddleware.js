/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts route execution to specific authorized user roles.
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ error: 'Access forbidden. User role missing.' });
        }

        if (!allowedRoles.includes(req.user.role) && req.user.role !== 'Platform Admin') {
            return res.status(403).json({ 
                error: `Forbidden: Role '${req.user.role}' is not authorized to access this resource. Required roles: [${allowedRoles.join(', ')}]` 
            });
        }

        next();
    };
};

module.exports = { authorizeRoles };
