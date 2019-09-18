var mongoose = require('mongoose')
require('./model.js');

var House = mongoose.model('House');
House.deleteMany({},(err,docs)=>{
    if(err){
        console.log('err',err);
        return;
    }
   
    console.log('result:', docs)
})