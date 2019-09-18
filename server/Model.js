var mongoose = require('mongoose')
var uri = 'mongodb://localhost:27017/'

mongoose.Promise = global.Promise;

mongoose.connect(uri)

var HouseSchema = mongoose.Schema({
    title: String,
    code: String,
    money: String,
    href: String,
    houseType: String,
    area: String,
    tel: String,
    upTime: String, 
    create_at: Date,
    id: String,
    update_at: Date,
})

mongoose.model('House', HouseSchema)