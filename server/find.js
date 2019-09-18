var mongoose = require('mongoose')
require('./model.js');

var House = mongoose.model('House');
House.find({},(err,docs)=>{
    if(err){
        console.log('err',err);
        return;
    }
   
    console.log('result:', docs)
    console.log(docs.length)
})