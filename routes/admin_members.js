var express = require('express');
var router = express.Router();
var mkdir = require('mkdirp');
var fs = require('fs-extra');
var resizeImg = require('resize-img');
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;

// Get Users model
var User = require('../models/user');

/*
 * GET users index 會員帳號管理(全部會員列表)
 */
router.get('/', isAdmin, function(req,res){
    var count;

    User.count(function(err,c){        
        count = c;
    });

    User.find(function(err,users){
        res.render('admin/members',{
            users:users,
            count:count
        });
    });
});

/*
 * GET edit member 修改會員資料
 */
router.get('/edit-member/:id', isAdmin, function(req,res){
    
    var errors;

    if(req.session.errors) 
        errors = req.session.errors;
    req.session.errors = null;
    
    User.findById(req.params.id,function(err,u){
        if(err){ 
            console.log(err);
            res.redirect('/admin/members');
        }else{            
            res.render('admin/edit_member',{
                errors:errors,

                title:'modifyUser',
                id:u._id,
                username:u.username,

                name:u.name,
                email:u.email,
                phone:u.phone,
                address:u.address
            });           
        }
    });

});

/*
 * POST edit member
 */
router.post('/edit-member/:id',function(req,res){
    
    var id = req.params.id; //資料庫的使用者ID,非帳號ID
    var name = req.body.name;
    var email = req.body.email;
    var phone = req.body.phone;
    var address = req.body.address;

    req.checkBody('name','您真實姓名(必填)!').notEmpty();
    req.checkBody('email','Email信箱(必填)!').isEmail();

    var errors = req.validationErrors();
	
	if(errors){
        req.session.errors = errors;
        res.redirect('/admin/members/edit-member/'+id);
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
                            
                req.flash('success', '會員資料修改成功!');
                res.redirect('/admin/members/edit-member/'+id);
            });
        });
    } 
});

/*
 * GET delete member 刪除會員帳號
 */
router.get('/delete-member/:id', isAdmin, function(req,res){
    var id = req.params.id;
        
    User.findByIdAndRemove(id,function(err){
        console.log(err);
    });
    
    req.flash('success','會員已刪除!');
    res.redirect('/admin/members/');
});

// Exports
module.exports = router;