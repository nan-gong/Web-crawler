var mongoose = require('mongoose')
require('./Model.js')

var House = mongoose.model('House')
var house = new House({
    title: '123',
    money: '123',
    href: 'http://ssasdfsdf.html',
    houseType: '三室一厅',
    area: '122m2',
    create_at: new Date(),
    id: '21341234', //随时生成的32位
    update_at: new Date(),
})

house.author = 'he'

house.save((err)=>{
    console.log('save status:', err?'failed':'success');
})