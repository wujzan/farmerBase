var mongoose = require('mongoose');

// Category Schema
var CategorySchema = mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    slug:{
        type:String
    }
},{versionKey:false});

var Category = module.exports = mongoose.model('Category',CategorySchema);