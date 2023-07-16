var express = require('express');
var router = express.Router();
var mkdir = require('mkdirp');
var fs = require('fs-extra');
var resizeImg = require('resize-img');
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;

// Get Article model
var Article = require('../models/article');

// Get Category model
var Category = require('../models/category');


/*
 * GET articles index 刊登管理(全部文章列表)
 */
router.get('/', isAdmin, function(req,res){
    var count;

    Article.count(function(err,c){        
        count = c;
    });

    Article.find(function(err,articles){
        res.render('admin/articles',{
            articles:articles,
            count:count
        });
    });
});

/*
 * GET add article
 */
router.get('/add-article', isAdmin, function(req,res){
    
    var title = "";
    var desc = "";
    var city = "";

    Category.find(function(err,categories){
        res.render('admin/add_article',{            
            title:title,
            desc:desc,
            categories:categories,            
            city:city
        });
    });
});

/*
 * POST add article
 */
router.post('/add-article',function(req,res){

    // var imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";
    if(!req.files){
        var imageFile ="";
    }else{
        var imageFile = typeof(req.files.image) !== "undefined" ? req.files.image.name : ""; 
    }

    req.checkBody('title', '名稱(必填).').notEmpty();
    req.checkBody('desc', '描述(必填).').notEmpty();
    req.checkBody('image', '您必須上傳圖片.').isImage(imageFile); 

    var title = req.body.title;
    var slug = title.replace(/\s+/g,'-').toLowerCase();
    var desc = req.body.desc;
    var city = req.body.city;    
    var category = req.body.category;

    var errors = req.validationErrors();    

    if(errors){
        Category.find(function(err,categories){
            res.render('admin/add_article',{
                errors:errors,
                title:title,
                desc:desc,
                categories:categories                
            });
        });
    }else{
        Article.findOne({slug:slug},function(err,article){
            if(article){
                req.flash('danger','文章名稱已經存在, 請使用別的!');
                Category.find(function(err,categories){
                    res.render('admin/add_article',{
                        title:title,
                        desc:desc,
                        categories:categories
                    });
                });
            }else{
                var article = new Article({
                    title:title,
                    slug:slug,
                    desc:desc,
                    city:city,
                    category:category,
                    image:imageFile
                });


                article.save( (err)=> {                
                    if (err)
                        return console.log(err);
    
                    mkdir('public/product_images/' + article._id).then((err)=>console.log(err));
    
                    mkdir('public/product_images/' + article._id + '/gallery').then((err)=>console.log(err));
                    
                    mkdir('public/product_images/' + article._id + '/gallery/thumbs').then(
                        (err) => {
                            console.log(err);
                            if (imageFile != "") {
                                var productImage = req.files.image;
    
                                var path = 'public/product_images/' + article._id + '/' + imageFile;
    
                                productImage.mv(path, (err) => {
                                    return console.log(err);
                                });
                            }
                        }
                    );

                    req.flash('success', '文章已新增!');
                    res.redirect('/admin/articles');
                });

            }
        })
    }

});

/*
 * GET edit article 取得要編輯(修改)的文章之詳細內容
 */
router.get('/edit-article/:id', isAdmin, function(req,res){
    
    var errors;

    if(req.session.errors) 
        errors = req.session.errors;
    req.session.errors = null;

    Category.find(function(err,categories){
        Article.findById(req.params.id,function(err,a){
            if(err){ 
                console.log(err);
                res.redirect('/admin/articles');
            }else{
                var galleryDir = 'public/product_images/'+a._id+'/gallery';
                var galleryImages = null;

                fs.readdir(galleryDir,function(err,files){
                    if(err){
                        console.log(err);
                    }else{
                        galleryImages = files;

                        res.render('admin/edit_article',{
                            title:a.title,
                            errors:errors,
                            desc:a.desc,
                            city:a.city,
                            categories:categories,
                            category:a.category.replace(/\s+/g,'-').toLowerCase(),
                            image:a.image,
                            galleryImages:galleryImages,
                            id:a._id
                        });

                    }
                });
            }
        });        
    });

});

/*
 * POST edit article
 */
router.post('/edit-article/:id',function(req,res){    
    if(!req.files){
        var imageFile ="";
    }else{
        var imageFile = typeof(req.files.image) !== "undefined" ? req.files.image.name : ""; 
    }

    req.checkBody('title', '名稱(必填).').notEmpty();
    req.checkBody('desc', '描述(必填).').notEmpty();
    req.checkBody('image', '您必須上傳圖片.').isImage(imageFile); 

    var title = req.body.title;
    var slug = title.replace(/\s+/g,'-').toLowerCase();
    var desc = req.body.desc;
    var city = req.body.city;    
    var category = req.body.category;
    var pimage = req.body.pimage;
    var id = req.params.id;

    var errors = req.validationErrors();

    // 原因:GET的寫法
    // if(req.session.errors) 
    //     errors = req.session.errors;
    // req.session.errors = null;

    if(errors){
        req.session.errors = errors;
        res.redirect('/admin/articles/edit-article/'+id);
    }else{
        Article.findOne({slug:slug, _id:{'$ne':id}}, function(err,a){
            if(err)
                console.log(err);
            
            if(a){
                req.flash('danger','文章名稱已經存在, 請使用別的!');
                res.redirect('/admin/articles/edit-article/'+id);
            }else{
                Article.findById(id, function(err,a){
                    if(err)
                        console.log(err);

                    a.title = title;
                    a.slug = slug;
                    a.desc = desc;
                    a.city = city;
                    a.category = category;
                    if(imageFile!="") a.image=imageFile;

                    a.save(function(err){
                        if(err)
                            console.log(err);
                        
                        if(imageFile!=""){
                            if(pimage!=""){
                                fs.remove('public/product_images/'+id+'/'+pimage,function(err){
                                    if(err)
                                        console.log(err);
                                });                            
                            }

                            var productImage = req.files.image;    
                            var path = 'public/product_images/' + id + '/' + imageFile;    
                            productImage.mv(path, (err) => {
                                return console.log(err);
                            });
                        }

                        req.flash('success', '文章已修改!');
                        res.redirect('/admin/articles/edit-article/'+id);
                    });
                });
            }
        });
    }

});

/*
 * POST article gallery 文章陳列圖片
 */
router.post('/article-gallery/:id',function(req,res){
    var productImage = req.files.file;
    var id = req.params.id;
    var path = 'public/product_images/'+id+'/gallery/'+req.files.file.name;
    var thumbsPath = 'public/product_images/'+id+'/gallery/thumbs/'+req.files.file.name;

    productImage.mv(path,function(err){
        if(err)
            console.log(err);
        
        resizeImg(fs.readFileSync(path),{width:100,height:100}).then(function(buf){
            fs.writeFileSync(thumbsPath,buf);
        });
    });

    // 200本身是請求成功的響應值
    res.sendStatus(200);
});

/*
 * GET delete image 刪除圖片
 */
router.get('/delete-image/:image', isAdmin, function(req,res){
    var originalImage = 'public/product_images/'+req.query.id+'/gallery/'+req.params.image;
    var thumbImage = 'public/product_images/'+req.query.id+'/gallery/thumbs/'+req.params.image;

    fs.remove(originalImage,function(err){
        if(err){
            console.log(err);
        }else{
            fs.remove(thumbImage,function(err){
                if(err){
                    console.log(err);
                }else{
                    req.flash('success', '圖片已刪除!');
                    res.redirect('/admin/articles/edit-article/'+req.query.id);
                }
            });
        }
    });
});

/*
 * GET delete article 刪除文章
 */
router.get('/delete-article/:id', isAdmin, function(req,res){
    var id = req.params.id;
    var path = 'public/product_images/'+id;

    fs.remove(path,function(err){
        if(err){    
            console.log(err);
        }else{
            Article.findByIdAndRemove(id,function(err){
                console.log(err);
            });
            
            req.flash('success','文章已刪除!');
            res.redirect('/admin/articles/');
        }
    });

});

// Exports
module.exports = router;