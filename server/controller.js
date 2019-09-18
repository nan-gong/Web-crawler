const express = require('express')
var mongoose = require('mongoose')
// require('./model.js');

var House = mongoose.model('House');
const router = express.Router();

//请求列表

router.get('/show',(req,res)=>{
    House.find({},(err,docs)=>{
        if(err){
            console.log('err',err);
            return;
        }
       
        console.log('result:', docs)
        console.log(docs.length)
        return res.json(docs);
    })
})

exports.router = router;