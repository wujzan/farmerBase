var mongoose = require('mongoose');

// Article Schema
var ArticleSchema = mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    slug:{
        type:String
    },
    desc:{
        type:String,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    price:{
        type:Number        
    },
    image:{
        type:String
    },
    city:{
        type:String,
        required:true
    }
});

var Article = module.exports = mongoose.model('Article',ArticleSchema);