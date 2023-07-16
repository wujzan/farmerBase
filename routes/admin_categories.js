var express = require('express');
var router = express.Router();
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;

// Get Category model
var Category = require('../models/category');

/*
 * GET category index 刊登分類管理(全部目錄列表)
 */
router.get('/', isAdmin, function(req,res){

    Category.find(function(err,categories){
        if(err)
            return console.log(err);

        res.render('admin/categories',{
            categories:categories
        });
    });
});

/*
 * GET add category 新增刊登分類(目錄)
 */
router.get('/add-category', isAdmin, function(req,res){
    
    var title = "";

    res.render('admin/add_category',{
        title:title,        
    });
});

/*
 * POST add category
 */
router.post('/add-category',function(req,res){

    req.checkBody('title', '分類名稱(必填).').notEmpty();

    var title = req.body.title;
    var slug = title.replace(/\s+/g,'-').toLowerCase();

    var errors = req.validationErrors();

    if(errors){        
        res.render('admin/add_category',{
            errors:errors,
            title:title
        });
    }else{
        Category.findOne({slug:slug},function(err,category){
            if(category){
                req.flash('danger','分類名稱已存在, 請使用別的!');
                res.render('admin/add_category',{
                    title:title
                });
            }else{
                var category = new Category({
                    title:title,
                    slug:slug
                });

                category.save(function(err){
                    if(err)
                        return console.log(err);
                    
                    Category.find(function(err,categories){
                        if(err){
                            console.log(err);
                        }else{
                            req.app.locals.categories = categories;
                        }
                    });

                    req.flash('success','分類已新增!');
                    res.redirect('/admin/categories');
                });
            }
        });
    }

});

/*
 * GET edit category
 */
router.get('/edit-category/:id', isAdmin, function(req,res){
    
    Category.findById(req.params.id,function(err,category){
        if(err) 
            return console.log(err);

        res.render('admin/edit_category',{
            title:category.title,
            id:category._id
        });
    });    

});

/*
 * POST edit category
 */
router.post('/edit-category/:id',function(req,res){

    req.checkBody('title', '分類名稱(必填).').notEmpty();

    var title = req.body.title;
    var slug = title.replace(/\s+/g,'-').toLowerCase();
    var id = req.params.id;

    var errors = req.validationErrors();    

    if(errors){        
        res.render('admin/edit_category',{
            errors:errors,
            title:title,            
            id:id
        });
    }else{
        Category.findOne({slug:slug, _id:{'$ne':id}}, function(err,category){
            if(category){                
                req.flash('danger','分類名稱已存在, 請使用別的!');
                res.render('admin/edit_category',{
                    title:title,                    
                    id:id
                });
            }else{            
                Category.findById(id, function(err,category){
                    if(err)
                        return console.log(err);

                    category.title = title;
                    category.slug = slug;

                    category.save(function(err){
                        if(err)
                            return console.log(err);
                        
                        Category.find(function(err,categories){
                            if(err){
                                console.log(err);
                            }else{
                                req.app.locals.categories = categories;
                            }
                        });

                        req.flash('success','分類已修改!');
                        res.redirect('/admin/categories/edit-category/'+id);
                    });
                });


            }
        });
    }

});

/*
 * GET delete category
 */
router.get('/delete-category/:id', isAdmin, function(req,res){
    Category.findByIdAndRemove(req.params.id,function(err){
        if(err)
            return console.log(err);
        
        Category.find(function(err,categories){
            if(err){
                console.log(err);
            }else{
                req.app.locals.categories = categories;
            }
        });
        
        req.flash('success','分類已被刪除!');
        res.redirect('/admin/categories/');
    });
});

// Exports
module.exports = router;