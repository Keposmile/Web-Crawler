var superagent = require('superagent');
var cheerio = require('cheerio');
var async = require('async');

var fs = require('fs');
var request = require('request');
var phantom = require('phantom');

var sitepage=null;
var phInstance=null;

phantom.create(['--ignore-ssl-errors=yes','--load-images=no'])
    .then(instance =>{
      phInstance=instance;
      return instance.createPage();
    })
    .then(page=>{
      sitepage=page;
      return page.open("http://huaban.com/explore/gufenghaibao/");
    })
    .then(status=>{
      console.log(status);
      return sitepage.property('content');
    })
    .then(content=>{
      // console.log(content);
      var $=cheerio.load(content);
      var imgInfo=[];
      console.log("imginfo:"+$("#waterfall>div>a>img").length);

      $("#waterfall>div>a>img").each(function(){
        var $this=$(this);
        var item={
          url:$this.attr('src')
        };
        console.log(item.url);
        var id=item.url.split("/");
        console.log(id[3]);
        if(Array.isArray(id)){
          item.id=id[3];
          item.url="http:"+item.url;
          imgInfo.push(item);
        }
      });

      async.mapLimit(imgInfo,5,function(img,callback){
        // console.log(img);
        saveImg(img,callback);
      },function(err,result){
        console.log('抓取的图片数：' + imgInfo.length);
      });

    })
    .catch(error=>{
      console.log("err_info:"+error);
      phInstance.exit();
    });

var concurrentCount=0;//并发数记录
var saveImg = function(img,callback){
  var url=img.url;
  var id=img.id;
  var filepath="./img/"+id+".jpg";
  fs.exists(filepath,function(exists){
    if(exists){
      console.log(filepath+"is exist!");
    }else{
      concurrentCount++;
      console.log(filepath+"开始下载,当前任务并发量:"+concurrentCount);
      request.head(url,function(err,res,body){
        if(err){
          console.log("err:"+err);
          callback(null,err);
        }
        request(url).pipe(fs.createWriteStream(filepath)).on("close",function(){
          console.log("Done:"+url);
          concurrentCount--;
          callback(null,url);
        });
      });
    }
  });
};
