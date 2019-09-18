const superagent = require('superagent')
const express = require('express')
const async = require('async')
const path = require('path')

var router = express.Router();
require('node-jsx').install();
var React = require('react')
const app = express()
const url = require('url')
const cheerio = require('cheerio')
const fs = require('fs')

//mongodb 写入
var mongoose = require('mongoose')
require('./server/Model.js')
var House = mongoose.model('House')

//接口
var controller = require('./server/controller')
//服务端渲染ejs模板
var ejs = require('ejs')
app.set('views', path.join('views'))
// app.engine('.html',ejs.__express)
app.set('view engine','ejs')

let data = [];
let pageInfo = {};
let allUrl = []
let urls = [];
let num = 0;
let msg = ''
//目标网站 
let lianjiaUrl = 'https://bj.lianjia.com/'
let zufangUrl = 'https://bj.lianjia.com/zufang/'
//分页规律 https://bj.lianjia.com/zufang/pg2/#contentList
// #content .content__list--item--main .content__list--item--title a .text()
// href地址
let server = app.listen(3000, function () {
    let host = server.address().address;
    let port = server.address().port;
    console.log('Your App is running at http://%s:%s', host, port);
  });


//获取单页数据
function getPageData(curUrl, callback){
    console.log(curUrl)
    superagent.get(curUrl).end((err,res)=>{
        if(err) return console.log(err)
        let $ = cheerio.load(res.text)
        //获取总页数
        let totalPage = $('#content .content__pg').attr('data-totalpage')
        let curPage = $('#content .content__pg').attr('data-curpage')
        let dataUrl = $('#content .content__pg').attr('data-url')
        //console.log($('#content .content__pg'))
        pageInfo = {
            'totalPage':totalPage,
            'curPage': curPage,
            'dataUrl': dataUrl,
        }
        console.log(`正在抓取${curPage}页`)
        //获取首页的链接
        $('#content .content__list--item .content__list--item--main>p:first-child>a:first-child').each((index, ele)=>{
            let $ele = $(ele)
            let href = url.resolve(lianjiaUrl, $ele.attr('href'));
            allUrl.push(href);
        })

        callback(null, allUrl)
       
    })
}

function getInfo(infoUrl, callback){
   
    console.log(infoUrl)
    num ++;
    console.log(`正在抓取页，当前并发数量：${num}`)
    superagent.get(infoUrl).end((err, res)=>{
        if(err){
            return console.log(err)
        }
        let $ = cheerio.load(res.text);
        //标题  .content p.content__title text()
        //租金 #aside .content__aside--title span内的文字
        //格局 .content__aside__list .content__article__table span:nth-child(2) i.typ旁边的元素
        //平方数 .content__aside__list .content__article__table span:nth-child(2) i.area 旁边的元素
        // orient旁边的元素是房间的朝向
        //房源上架时间 content__subtitle 房源上架时间 截取10位！
        let title = $('div.content .content__title:first-child').text();
        let money = $('#aside .content__aside--title>span:first-child').text();
        let houseType = $('#aside .content__aside__list .content__article__table>span').eq(1).last().html()
        let area = $('#aside .content__aside__list .content__article__table>span').eq(2).last().html()
        
        houseType = houseType ?houseType.substr(houseType.indexOf('</i>') + 4):''
        area = area? area.substr(area.indexOf('</i>')+4):''
        let tel = $('#aside .content__aside__list .content__aside__list--bottom:first-child').text()
        let code = $('#aside .content__aside__list .content__aside__list--bottom:first-child').attr('housecode')
        let upTime = $('div.content .content__subtitle').html()
        upTime = upTime? upTime.substr(upTime.indexOf('<i class="hide">')+ 16, upTime.indexOf('<i class="house_code">') - 28):''
        upTime = upTime? upTime.substr(upTime.indexOf('</i>') + 4):''
       // console.log(unescape(upTime.replace(/&#x/g,'%u').replace(/;/g,'')))
        
        let houseData = {
            'title':title,
            'houseCode': code,
            'money':money,
            'href': infoUrl,
            'houseType':unescape(houseType.replace(/&#x/g,'%u').replace(/;/g,'')),
            'area': unescape(area.replace(/&#x/g,'%u').replace(/;/g,'')),
            'tel':tel,
            'upTime':unescape(upTime.replace(/&#x/g,'%u').replace(/;/g,'')),
        }
        // fs.appendFile(`data/total.json`, `${JSON.stringify(houseData)},\n` ,'utf-8', function (err) {
        //     if(err) throw new Error("appendFile failed...");
        //     setTimeout(()=>{
        //         num --;
        //         console.log(`数据写入success...`);
        //         callback(null, 'success')
        //     },2000)
        // });
      
        var house = new House(houseData)

        house.author = 'he'

        house.save((err)=>{
            if(err) throw new Error("db insert failed...");
            console.log('save status:', err?'failed':'success');
            num --;
            callback(null, 'success')
        })
        
        data.push(houseData)
        
    })

}
// 计划按线程执行
function run(){
    console.log('--------------0---------')
    msg = '数据抓取中...'
    async.mapSeries(['changping','haidian'],function(area, callback){
        console.log(area)
        console.log(`开始请求${area}的房源数据。` )
        
        request(area, callback);
    })
}

function request(area,indexCallback){
    console.log('---------')
    let ok =0;
    let page = 1;
    let urls = [];
    let pageInfo = {};
    //async控制并发数量,
    async.series([
        //第一次发送请求拿到页数
        (cb) =>{
            msg = '数据总页数抓取中...'
            superagent.get(`${zufangUrl}${area}/pg${page}`).end((err,res)=>{
                if(err) return console.log('获取数据失败',err)
                let $ = cheerio.load(res.text)
                //获取总页数
                let totalPage = $('#content .content__pg').attr('data-totalpage')
                let curPage = $('#content .content__pg').attr('data-curpage')
                let dataUrl = $('#content .content__pg').attr('data-url')
                // console.log($('#content .content__pg'))
                pageInfo = {
                    'totalPage':totalPage,
                    'curPage': curPage,
                    'dataUrl': dataUrl,
                }
                // console.log(pageInfo)
                cb(null, pageInfo) // 第一个参数是异常错误,第二个参数的返回结果
            })
        },
        //根据第一次得到 的pageInfo,创建urls数据
        (cb)=>{
            console.log('--------2-------')
            msg = '数据页数链接抓取中...'
            for(let i=1;i<= Math.ceil(pageInfo.totalPage);i++){
                urls.push(`${zufangUrl}${area}/pg${i}`)
            }
            cb(null, urls)
        },
        (cb)=>{
            // console.log(urls)
            console.log('--------3-------')
            //mapLimit控件请求，每次最多发送3条请求
            msg = '数据总记录链接抓取中...'
            async.mapLimit(urls, 3, (url, callback) =>{
                getPageData(url, callback)
            }, (err, result)=>{
                if(err) throw err;
                cb(null, allUrl)
            })
        },
        (cb) =>{
            console.log('------5------')
            console.log(allUrl)
            msg = '数据详细信息抓取中...'
            async.mapLimit(allUrl, 50, (href, callback) =>{
               getInfo(href, callback)
            }, (err, result)=>{
                if(err) throw err;
                console.log(arguments)
                if(arguments[1]){
                    ok = 1
                }
                cb(null, ok)
            })
           
        },
        ()=>{
            if(ok){
                msg = '数据请求完成...'
                setTimeout(function(){
                   
                    console.log(`数据请求完成~~~`);
                    indexCallback(null)
                }, 5000)
            }else {
                msg = '数据请求完成！！！'
                console.log(`数据请求完成!!!`);
                indexCallback(null)
            }
        }
    ])
}

app.get('/',(req, res)=>{
    msg = '数据开始加载'
    run();
    res.render('index', {title:'hehedaidai',name: msg,data:[]});
})

app.get('/show',(req, res) =>{
    res.render('index',{ 
        title:'hehedaidai',
        name:'查询结果',
        data: data
    })
})

const apiRouter = (app)=>{
    app.use('/list', controller.router)
   
}

apiRouter(app)