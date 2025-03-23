

module.exports.isLoggedin = (req,res,next)=>{
    if (!req.isAuthenticated()) {
        return res.render("admin/login");
    }
    next();
}

module.exports.isAdminAuthenticated = (req, res, next)=>{
    if (req.isAuthenticated() && req.user && req.user.role === 'admin') {
        return next();
    }
    res.status(401).json({ message: 'Unauthorized: Admin access only' });
}


