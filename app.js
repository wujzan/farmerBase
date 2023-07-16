var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var config = require('./config/database');
var bodyParser = require('body-parser');
var session = require('express-session');
var expressValidator = require('express-validator');
var fileUpload = require('express-fileupload');
var passport = require('passport');

// 資料庫連接(利用mongoose)
mongoose.connect(config.database);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('Connected to MongoDB');
});

// 初始化
var app = express();

// 設定nodejs的View Engine為ejs
app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');

// 設定 public 資料夾
app.use(express.static(path.join(__dirname,'public')));

// 設定 global error 全域錯誤變數
app.locals.errors = null;


// Get Page Model
var Page = require('./models/page');


//由資料庫取得 全部各頁面資訊, 供header.ejs使用
// 由於這邊是寫在app.js裡面, 造成Page有修改, header刷新都需重啟伺服器的BUG
// 所以在admin_pages.js中, edit&delete動作後都再做一次來解決app.locals
Page.find({}).sort({sorting:1}).exec(function(err,pages){
    if(err){
        console.log(err);
    }else{
        app.locals.pages = pages;   
    }
});

// Get Category Model
var Category = require('./models/category');

//由資料庫取得 全部目錄列表, 供header.ejs使用
Category.find(function(err,categories){
    if(err){
        console.log(err);
    }else{
        app.locals.categories = categories;
    }
});


// 檔案上傳元件 (Express fileUpload middleware)
app.use(fileUpload());


// Body Parser middleware
//
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// Express Session middleware
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    //cookie: { secure: true }
}));

// Express Validator middleware
app.use(expressValidator({
    errorFormatter:function(param,msg,value){
        var namespace = param.split('.')
        , root = namespace.shift()
        , formParam = root;

        while(namespace.length){
            formParam += '[' +namespace.shift() + ']';        
        }
        return{
            param : formParam,
            msg : msg,
            value : value
        };
    },
    customValidators:{
        isImage:function(value,filename){
            var extension=(path.extname(filename)).toLowerCase();
            switch(extension){
                case '.jpg':
                    return '.jpg';
                case '.jpeg':
                    return '.jpeg';
                case '.png':
                    return '.png';
                case '':
                    return '.jpg';
                default:
                    return false;
            }
        }
    }
}));

// Express Messages middleware
app.use(require('connect-flash')());
app.use(function (req,res,next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// Passport 設定(Config)
require('./config/passport')(passport);
// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());


app.get('*',function(req,res,next){
    res.locals.cart = req.session.cart;
    res.locals.user = req.user || null;
    next();
});

// 設定路由 routes
var users = require('./routes/users.js');
var pages = require('./routes/pages.js');
var articles = require('./routes/articles.js');
var favorite = require('./routes/favorite.js');
var adminMembers = require('./routes/admin_members.js');
var adminPages = require('./routes/admin_pages.js');
var adminCategories = require('./routes/admin_categories.js');
var adminArticles = require('./routes/admin_articles.js');


app.use('/admin/pages',adminPages);
app.use('/admin/categories',adminCategories);
app.use('/admin/articles',adminArticles);
app.use('/admin/members',adminMembers);
app.use('/articles',articles);
app.use('/favorite',favorite);
app.use('/users',users);
app.use('/',pages);


app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

//app.js
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    console.log(err.message);    
});


// 啟動伺服器的參數
// var port = 3000;
var port = process.env.PORT || 5000; //發布網站到Heroku所需設定成process.env
app.listen(port,function(){
    console.log('Server Finish started on port '+port);
});