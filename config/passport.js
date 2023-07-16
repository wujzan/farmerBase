var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');
var bcrypt = require('bcryptjs');

module.exports = function(passport){
    passport.use(new LocalStrategy(function(username,password,done){
        User.findOne({username:username},function(err,user){
            if(err)
                console.log(err);
            
            if(!user){
                return done(null,false,{message:'找不到使用者帳號!!'});
            }

            bcrypt.compare(password,user.password,function(err,isMatch){
                if(err)
                    console.log(err);

                if(isMatch){
                    return done(null,user);
                }else{
                    return done(null,false,{message:'密碼錯誤!!'})
                }
            });
        });
    }));

    // 從user資料中撈ID
    passport.serializeUser(function(user,done){
        done(null,user.id);
    });

    // 以ID去撈user資料
    passport.deserializeUser(function(id,done){
        User.findById(id,function(err,user){
            done(err,user);
        });
    });

    // serializeUser 是將使用者資訊存在 session 中, 一般是使用 user ID 以便在資料庫中查詢
    // deserializeUser 根據傳入的id, 到db查詢使用者資料, 再存到req.user, 讓express 的 req.user 可以取得使用者詳細資料
}