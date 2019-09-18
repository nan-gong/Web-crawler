const superagent = require('superagent')
const express = require('express')
var router = express.Router()
require('node-jsx').install()
const app = express()
const url = require('url')
const cheerio = require('cheerio')
const fs = require('fs')
const Nightmare = require('nightmare')         // 自动化测试包，处理动态页面
const nightmare = Nightmare({ show: true })    // show:true  显示内置模拟浏览器

//服务端渲染ejs模板
var ejs = require('ejs')
app.engine('.html',ejs.__express)
app.set('view engine','ejs')
let data = []   // 存放房源具体数据
let count = []  // 存放各区域房源数量
let allUrl = [] // 存放待抓取url队列
//目标网站 
let lianjiaUrl = 'https://bj.lianjia.com/'  // url前缀
let zufangUrl = 'https://bj.lianjia.com/zufang/'  // 种子url1
let haidianUrl = 'https://bj.lianjia.com/zufang/haidian/rt200600000001/'    // 种子url2
//分页规律 https://bj.lianjia.com/zufang/pg2/#contentList
// #content .content__list--item--main .content__list--item--title a .text()
// href地址
let server = app.listen(3001, function () {
    let host = server.address().address
    let port = server.address().port
    console.log('Your App is running at http://%s:%s', host, port)
  })

// 通过浏览器自动化库获取数据
// nightmare
// .goto(zufangUrl)
// .wait('.filter .filter__wrapper ul[data-target=area] li>a')
// .type('.search__wrap input.search__input', '海淀第一海景房')
// // .click('.filter .filter__wrapper ul[data-target=area] li:nth-child(2)>a')
// .evaluate(() => document.querySelector(".wrapper").innerHTML)
// .then(htmlStr => {
//     let $ = cheerio.load(htmlStr)
//     $('.filter .filter__wrapper ul[data-target=area] li>a').each((index, ele) => {
//         let $ele = $(ele)
//         let href = url.resolve(lianjiaUrl, $ele.attr('href'))
//         superagent.get(href).end((err, res) => {
//             if (err) throw err
//             let $ = cheerio.load(res.text)
//             let houseData = {
//                 'name': $('.filter .filter__wrapper ul:nth-child(2) li.strong>a').text(),
//                 'value': $('.content .content__article .content__title .content__title--hl').text()
//             }
//             count.push(houseData)
//         })
//     })
// })
// .catch(error => {
//   console.log(`抓取失败 - ${error}`)
// })


// 获取各区域房屋套数
superagent.get(zufangUrl).end((err, res) => {
    if (err) throw err
    let $ = cheerio.load(res.text)
    $('.filter .filter__wrapper ul[data-target=area] li>a').each((index, ele) => {
        let $ele = $(ele)
        let href = url.resolve(lianjiaUrl, $ele.attr('href'))
        superagent.get(href).end((err, res) => {
            if (err) throw err
            let $ = cheerio.load(res.text)
            let houseData = {
                'name': $('.filter .filter__wrapper ul:nth-child(2) li.strong>a').text(),
                'value': $('.content .content__article .content__title .content__title--hl').text()
            }
            count.push(houseData)
        })
    })
})

// 获取海淀首页所有房源链接元素
superagent.get(haidianUrl).end((err,res)=>{
    if(err) return console.log(err)
    let $ = cheerio.load(res.text)
    $('#content .content__list--item .content__list--item--main>p:first-child>a:first-child').each((index, ele)=>{
        let $ele = $(ele)
        // 拼接单独房源url
        let href = url.resolve(lianjiaUrl, $ele.attr('href'))
        allUrl.push(href)
        
        superagent.get(href).end((err, res)=>{
            if(err){
                return console.log(err)
            }
            let $ = cheerio.load(res.text)
            //标题  .content p.content__title text()
            //租金 #aside .content__aside--title span内的文字
            //格局 .content__aside__list .content__article__table span:nth-child(2) i.typ旁边的元素
            //平方数 .content__aside__list .content__article__table span:nth-child(2) i.area 旁边的元素
            // orient旁边的元素是房间的朝向
            //房源上架时间 content__subtitle 房源上架时间 截取10位
            let title = $('div.content .content__title:first-child').text()
            let money = $('#aside .content__aside--title>span:first-child').text()
            let houseType = $('#aside .content__aside__list .content__article__table>span').eq(1).last().html()
            let area = $('#aside .content__aside__list .content__article__table>span').eq(2).last().html()
            
            houseType = houseType.substr(houseType.indexOf('</i>') + 4)
            area = area.substr(area.indexOf('</i>')+4)
            let code = $('#aside .content__aside__list .content__aside__list--bottom:first-child').attr('housecode')
            let upTime = $('div.content .content__subtitle').html()
            upTime = upTime.substr(upTime.indexOf('<i class="hide">')+ 16, upTime.indexOf('<i class="house_code">') - 28)
            upTime = upTime.substr(upTime.indexOf('</i>') + 4)
           // console.log(unescape(upTime.replace(/&#x/g,'%u').replace(/;/g,'')))
            
            let houseData = {
                'title':title,
                'houseCode': code,
                'money':money,
                'href': href,
                'houseType':unescape(houseType.replace(/&#x/g,'%u').replace(/;/g,'')),
                'area': unescape(area.replace(/&#x/g,'%u').replace(/;/g,'')),
                'upTime':unescape(upTime.replace(/&#x/g,'%u').replace(/;/g,'')),
            }
            fs.appendFile('data/result1.json', `${JSON.stringify(houseData)},` ,'utf-8', function (err) {
                if(err) throw new Error("appendFile failed...")
                //console.log("数据写入success...")
            })
            
           // console.log(houseData)
            data.push(houseData)
        })
    })
   
})
app.set('views', './views')
// app.set('view engine', 'pug')
app.get('/',(req, res)=>{
    // res.send('Hello World!')
    res.render('index', { name: '链家爬虫数据可视化', data: data})
})

app.post('/fetch',function(req,res){
    res.json({data: data, count: count})
})

app.get('/show',(req, res) =>{
    res.send({
        data: data
    })
})

