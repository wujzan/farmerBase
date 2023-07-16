const e = require('connect-flash');
var express = require('express');
var router = express.Router();


// Get Article model
var Article = require('../models/article');

// Get Users model
var User = require('../models/user');


/* 
 * GET 把文章加入到我的最愛
 */
router.get('/add/:article',function(req,res){

    var id = req.user.id; //資料庫的使用者ID,非帳號ID
    var slug = req.params.article;

    Article.findOne({slug:slug},function(err,a){
        if(err)
            console.log(err);
                
        User.findById(id, function(err,user){    
            if(err)
                console.log(err);
            
            if((user.bookmark).includes(slug)){
                req.flash('success','已在我的最愛中');
                res.redirect('back');
            }else{
                user.bookmark.unshift(slug); //插入在陣列前端

                user.save(function(err){
                    if(err)
                        console.log(err);
                
                    req.flash('success','成功加入我的最愛!');
                    res.redirect('back');
                });
            }
            
        });
        
    });
});


/*
 * GET 我的最愛(收藏夾)
 */
router.get('/bookmarks',function(req,res){

    var id = req.user.id; //資料庫的使用者ID,非帳號ID

    User.findById(id, function(err,user){
        if(err)
            console.log(err);

        var bookmarks = user.bookmark;
        //console.log(bookmarks.length);
        
        var categors = []; //空陣列,用來存放查詢完的結果

        if(bookmarks.length===0){ //您的最愛目前是空的
            res.render('bookmarks',{
                title:'myBookmarks',
                bookmarks:bookmarks,
                categors:categors
            });
        } 

        bookmarks.forEach(function(bookmark){
            Article.findOne({slug:bookmark},function(err,i){
                if(err)
                    console.log(err);
                
                if(i==null) 
                    var cat='notFound'; //findOne若找不到會返回null,造成i.category無法讀取
                else
                    var cat = i.category;

                categors.push(cat);

                if(categors.length===bookmarks.length){
                    //console.log(categors);
                    res.render('bookmarks',{
                        title:'myBookmarks',
                        bookmarks:bookmarks,
                        categors:categors
                    });
                }                           
            });
            //console.log(categors);
        });
        //console.log(categors);
        
    });
});


/*
 * GET updata我的最愛(收藏夾)
 */
router.get('/update/:title',function(req,res){
    var id = req.user.id; //資料庫的使用者ID,非帳號ID  
    
    var slug = req.params.title;
    var removeIndex = req.query.index;
    var action = req.query.action;

    if(action==="delete"){
        User.findById(id, function(err,user){
            if(err)
                console.log(err);
            
            if((user.bookmark).includes(slug)){                
                user.bookmark.splice(removeIndex,1);
                    
                user.save(function(err){
                    if(err)
                        console.log(err);
                
                    req.flash('success','我的最愛資訊已更新!');
                    res.redirect('back');
                });
                
            }else{
                req.flash('success','已不在我的最愛');
                res.redirect('back');                
            }        
        });
    }
});

// Exports
module.exports = router;