exports.isUser = function(req,res,next){
    if(req.isAuthenticated()){
        next();
    }else{
        req.flash('danger','請先登入.');
        res.redirect('/users/login');
    }
}

exports.isAdmin = function(req,res,next){
    if(req.isAuthenticated() && res.locals.user.admin == 1){
        next();
    }else{
        req.flash('danger','請以管理員(admin)權限的帳號登入.');
        res.redirect('/users/login');
    }
}