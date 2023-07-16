var express = require('express');
var router = express.Router();
var passport = require('passport');
var bcrypt = require('bcryptjs');

var auth = require('../config/auth');
var isUser = auth.isUser;


// Get Users model
var User = require('../models/user');

/*
 * GET register 註冊帳號頁面
 */
router.get('/register',function(req,res){
    var name = "";
    var email = "";
    var username = "";

    res.render('register',{
        title:'Register',
        
        name:name,
        email:email,
        username:username
    });
});

/*
 * POST register
 */
router.post('/register',function(req,res){

    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;

    req.checkBody('name','您真實姓名(必填)!').notEmpty();
    req.checkBody('email','Email信箱(必填)!').isEmail();
    req.checkBody('username','使用者名稱(必填)!').notEmpty();
    req.checkBody('password','密碼(必填)!').notEmpty();
    req.checkBody('password2','二次輸入密碼不相同!').equals(password);

    var errors = req.validationErrors();

    if(errors){
        res.render('register',{
            errors:errors,
            user:null, // 登出(移除user的session)之後進入register,user not define
            title:'Register',

            name:name,
            email:email,
            username:username,
        });
    }else{
        User.findOne({username:username},function(err,user){
            if(err) 
                console.log(err);
            
            if(user){
                req.flash('danger','使用者名稱(ID)已經被註冊, 請使用別的!');
                res.redirect('/users/register');
            }else{
                var user = new User({
                    name:name,
                    email:email,
                    username:username,
                    password:password,
                    admin:0
                    // 權限: 一般用戶:0  管理員:1
                });

                //bcryptjs做不可逆的密碼加密, 無法從加密後回推原始密碼, 相對安全性提高非常多
                bcrypt.genSalt(10,function(err,salt){
                    bcrypt.hash(user.password,salt,function(err,hash){
                        if(err)
                            console.log(err);
                        
                        user.password = hash;

                        user.save(function(err){
                            if(err){
                                console.log(err);
                            }else{
                                req.flash('success','恭喜!!~您已經成功註冊');
                                res.redirect('/users/login');
                            }
                        });
                    });
                });
            }
            
        });
    }

});

/*
 * GET login 登入頁面
 */
router.get('/login',function(req,res){
    if(res.locals.user)        
        res.redirect('/');
    
    res.render('login',{
        title:'Log in'
    });
});

/*
 * POST login
 */
router.post('/login',function(req,res,next){
    passport.authenticate('local',{
        successRedirect: '/',
        failureRedirect:'/users/login',
        failureFlash:true
    })(req,res,next);
});

/*
 * GET logout
 */
router.get('/logout',function(req,res){
    // Passport函數調用logout()將刪除req.user屬性並清除登錄session
    req.logout();
    req.flash('success', '您已經登出了');
    res.redirect('/users/login');
});


/*
 * GET edit profile
 */
router.get('/edit-profile',isUser,function(req,res){

    var name = res.locals.user.name;
    var email = res.locals.user.email;
    var phone = res.locals.user.phone;
    var address = res.locals.user.address;

    res.render('profile',{
        title:'Profile',
        name:name,
        email:email,
        phone:phone,
        address:address
    });   
});

/*
 * POST edit profile
 */
router.post('/edit-profile',function(req,res){
    
    var id = req.user.id; //資料庫的使用者ID,非帳號ID
    var name = req.body.name;
    var email = req.body.email;
    var phone = req.body.phone;
    var address = req.body.address;

    req.checkBody('name','您真實姓名(必填)!').notEmpty();
    req.checkBody('email','Email信箱(必填)!').isEmail();

    var errors = req.validationErrors();
	
	if(errors){
        res.render('profile',{
            errors:errors,
            title:'Profile',
            user:req.user, //登入訊息

            name:name,
			email:email,
			phone:phone,
			address:address
        });
    }else{
        User.findById(id, function(err,user){    
            if(err)
                console.log(err);

            user.name = name; //真實姓名
            user.email = email;
            user.phone = phone;
            user.address = address;

            user.save(function(err){
                if(err)
                    console.log(err);
                            
                req.flash('success', '個人資料修改成功!');
                res.redirect('/users/edit-profile/');
            });
        });
    } 
});


// Exports
module.exports = router;