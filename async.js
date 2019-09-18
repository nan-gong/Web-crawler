const async = require('async')

//依次执行一个函数
async.series([
    function(callback){
        console.log('1')
    }
])