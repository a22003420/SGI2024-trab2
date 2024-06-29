/**
 * This is an example middleware that checks if the user is logged in.
 *
 * If the user is not logged in, it stores the requested url in `returnTo` attribute
 * and then redirects to `/login`.
 *
 */
// functions middleware.js 
module.exports = { 
    isAuth: (req, res, next) => { // Middleware to check if user is authenticated
        if (req.isAuthenticated()) {
            next();
        } else {
            req.session.returnTo = req.originalUrl;
            res.redirect('/login');
        }
    },
    isNotAuth: (req, res, next) => { // Middleware to check if user is not authenticated
        if (!req.isAuthenticated()) {
            next();
        } else {
            res.redirect('/success');
        }
    }
};