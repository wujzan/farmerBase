var express = require('express');
var router = express.Router();
var mkdir = require('mkdirp');
var fs = require('fs-extra');
var auth = require('../config/auth');
var isUser = auth.isUser;

// Get Article model
var Article = require('../models/article');

// Get Catergory model
var Category = require('../models/category');

/*
 * GET all articles 全部文章列表
 */
router.get('/',function(req,res){

    Article.find(function(err,articles){
        if(err)
            console.log(err);
        
        res.render('all_articles',{
            title:'All articles',
            articles:articles
        });        
    });
});

/*
 * GET articles by category 依分類目錄取得文章列表
 */
router.get('/:category',function(req,res){

    var categorySlug = req.params.category;

    Category.findOne({slug:categorySlug},function(err,c){
        if(err)
            console.log(err);

        if(!c){
            res.sendStatus(404);            
        }else{
            Article.find({category:categorySlug},function(err,articles){
                if(err)
                    console.log(err);
                
                res.render('cat_articles',{                    
                    title:c.title,
                    articles:articles
                });
            });
        }
    });
});

/*
 * GET article details 進入瀏覽文章
 */
router.get('/:category/:article',function(req,res){

    var galleryImages = null;
    var loggedIn = (req.isAuthenticated()) ? true : false;

    Article.findOne({slug:req.params.article},function(err,article){
        if(err){
            console.log(err);
        }else{
            var galleryDir = 'public/product_images/'+article._id+'/gallery';

            fs.readdir(galleryDir,function(err,files){
                if(err){
                    console.log(err);
                    
                    //heroku會清掉空資料夾,重新建立
                    mkdir('public/product_images/' + article._id + '/gallery').then((err)=>console.log(err));
                    mkdir('public/product_images/' + article._id + '/gallery/thumbs').then((err)=>console.log(err));
                }else{
                    galleryImages = files;
                
                    res.render('article',{
                        title:article.title,
                        a:article,
                        galleryImages:galleryImages,
                        loggedIn:loggedIn
                    });
                }
            });

        }
    });
});

// Exports
module.exports = router;