var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var http = require('http');
var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

var opn = require('opn');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  //res.send(gethtml());
  var data = fs.readFileSync('index.html', 'utf-8');
  res.send(data);
});

app.get('/adduser', function (req, res) {
  var querydata = req.query;
  var id = querydata.id;
  var name = querydata.name;
  adduser(id,name);
  console.log(scores);
  res.send('ok');
});

app.get('/gettable', function (req, res) {
  var rr = generatetable();
  res.send(rr);
});

app.get('/getdata', function (req, res) {
  var ret = {d:scores,m:match};
  res.send(ret);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


app.listen('12450', function () {
  console.log('server started');
  console.log('http://localhost:12450');
	loaduser();
  startserver();
  opn('http://localhost:12450/', {app: ['chrome']})
});
function startserver(){
  console.log(new Date());
  //users = {};
  //scores = {};
  //match = [];
  //loaduser();
  getlog();
  setTimeout(function(){
    startserver();
  },300000)
}


function gethtml(){
  var data = fs.readFileSync('index.html', 'utf-8');
  var rr = generatetable();
  var tail = '</div></div></body></html>';
  return data + rr + tail;
}


function getlog(){
  console.log('fetching:');
  var now = new Date();
  var year = now.getFullYear();
  var month = now.getMonth()+1;
  var day = now.getDate();
	var monthstr;
  if(month<10){
	  monthstr = "0"+month;
	}else{
	  monthstr = "" + month
	}
  var daystr;
  if(day<10){
	  daystr = "0"+day;
  }else{
	  daystr = "" + day;
  }
  var datestr = ""+year+monthstr+daystr;
	console.log(datestr);
	//for test only
  datestr = "20161231";
  var options = {
    hostname: 'www30.atpages.jp',
    port: 80,
    path: '/mojan/tenhou/l2260/log/all/sca'+datestr+'.log',
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    }
  };
  var body = "";
  var req = http.request(options, function (res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      body = body + chunk;
    });

    res.on('end', function () {
      users = {};
      score = {};
      match = [];
      loaduser();
      console.log('end');
      var chunka = body.split('\n');
      var matchno = 0;
      for(var i=0;i<chunka.length;i++){
        var linestr = chunka[i];
        var stra = linestr.split("|");
        var roomid = stra[0];
        if(stra.length==4&&roomid.indexOf("L2973")>-1){
          var time = stra[1];
          var matchtype = stra[2];
          console.log(stra);
          var matchresult = stra[3].trim();
          var mra = matchresult.split(" ");
          if(mra.length!=3&&mra.length!=4){
            console.log(linestr);
            console.log("err mra:"+mra);
            break;
          }
          var effect = true;
          var n2s = {};
          var matchstr = '';
          for(var j=0;j<mra.length;j++){
            var uas = mra[j];
            var n = uas.lastIndexOf("(");
            var name = uas.substring(0,n).trim();
            var matchnamestr;
            if(scores[name]==undefined){
              matchnamestr = '<span class="nunexists">'+name+'</span>';
            }else if(scores[name].st==0){
              matchnamestr = '<span class="nfailed">'+name+'</span>';
            }else{
              matchnamestr = '<span class="nexists">'+name+'</span>';
            }
            if(matchstr == ''){
              matchstr = matchnamestr + uas.substring(n);
            }else{
              matchstr = matchstr + '<br>' + matchnamestr + uas.substring(n);
            }
            if(scores[name]==undefined){
              effect = false;
            }else if(scores[name].st==0){
              effect = false;
            }else{

            }
            var score = parseFloat(uas.substring(n+1));
            n2s[name]=score;
          }
          var is3m = false;
          if(mra.length==3){
            is3m = true;
          }
          if(effect){
            matchno ++;
            var times = (1+matchno/10).toFixed(1);
            matchstr = matchstr + '<br>' + '<b>积分*' + times + '</b>';
            for(var p in scores){
              if(n2s[p]==undefined){
                scores[p].list.push(0);
              }else{
                var incscore = n2s[p];
                if(is3m){
                  incscore = incscore/2;
                }
                incscore = incscore * times;
                var newj = scores[p].j+incscore;
                if(newj<0){
                  scores[p].st=0;
                }
                scores[p].j=newj;
                scores[p].list.push(incscore);
              }
            }
          }else{
            for(var p in scores) {
              scores[p].list.push(0);
            }
          }
          match.push(matchstr);
        }
      }
    });

  });
  req.setTimeout(5000, function () {
    console.log('error when fetching');
  });

  req.on('error', function (e) {

  });



  req.end();
}

var iniscore = 233;
var scores = {};
var match = [];
function adduser(uid,name){
  if(users[name]==undefined){
    scores[name] = {"id":uid,"st":1,"j":iniscore,list:[]};
    users[name]=uid;
    console.log(users);
    saveuser();
    users = {};
    scores = {};
    match = [];
    loaduser();
    getlog();
    return true;
  }else{
    return false;
  }
}

function saveuser(){
  fs.writeFileSync('users.txt', JSON.stringify(users));
}
var users = {};
function loaduser(){
  var userstr = fs.readFileSync('users.txt','utf-8');
  console.log(userstr);
  var nu = eval("("+userstr+")");
  for(var p in nu){
    if(users[p]==undefined){
      users[p]=nu[p];
      scores[p] = {"id":nu[p],"st":1,"j":iniscore,list:[]}
    }
  }

}


function generatetable(){
  var max=0;
  for(var p in scores){
    if(scores[p].list.length>max){
      max = scores[p].list.length;
    }
  }
  var h = '<table class="table table-bordered">';
  h = h + '<tr><th></th><th></th>';
  for(var i=0;i<match.length;i++){
    h = h + '<th>';
    h = h + match[i];
    h = h + '</th>';
  }
  h = h + '</tr>';
  var retlist = [];
  for(var p in scores){
    retlist.push([p,scores[p]]);
  }
  retlist.sort(function(a,b){return b[1].j-a[1].j});
  for(var i=0;i<retlist.length;i++){
    h = h + '<tr>';
    var list = retlist[i][1].list;
    var len = list.length;
    var j0=50;
    h=h+'<td>'+retlist[i][0]+'</td>';
    h=h+'<td>'+retlist[i][1].j+'</td>';
    for(var j=0;j<max-len;j++){
      h=h+'<td> ';
      h=h+'<span class="inc1">+0.0<br>'+j0.toFixed(1)+'</span>';
      h=h+'</td>';
    }
    for(var j=max-len;j<max;j++){
      h=h+'<td>';
      var inc = list[j];
      j0 = j0 + inc;
      var incstr;
      if(inc>=0){
        incstr = '<span class="inc1">+'+inc.toFixed(1)+'</span>';
      }else{
        incstr = '<span class="inc0">'+inc.toFixed(1)+'</span>';
      }

      h=h+incstr+'<br>'+ j0.toFixed(1);
      h=h+'</td>';
    }
    h = h + '</tr>';
  }
  h=h+'</table>';
  return h + getrule();
}


function getrule(){
  var str = '<br>';
  str = str + '比赛规则<br>';
  str = str + '比赛时间：2016.12.30 23:00:0 到 2016.12.31 22:59:59' + '<br>';
  str = str + '再此页面填写天凤ID以及QQ号之后，在指定个室进行比赛' + '<br>';
  str = str + '<a href="http://tenhou.net/0/?L2973" target="_blank"><span style="font-size:28px"><b>个室地址</b></span></a><br>';
  str = str + '比赛自由组队，每次比赛后自动结算积分' + '<br>';
  str = str + '每人初始分数为233分' + '<br>';
  str = str + '每次比赛根据获得的pt数增加或减少得分' + '<br>';
  str = str + '三麻获得的积分为pt数的一半，四麻获得的积分为pt数' + '<br>';
  str = str + '当得分降为0或以下时，淘汰' + '<br>';
  str = str + '一局中只有所有参赛人员均<span class="nexists">已报名且未淘汰</span>时，才为有效比赛' + '<br>';
  str = str + '有任何一人<span class="nunexists">未报名</span>或<span class="nfailed"><b>已淘汰</b></span>，该局比赛不计分' + '<br>';
  str = str + '时间结束后，如果未淘汰人员超过4人，前4名进行决赛' + '<br>';
  str = str + '决赛为2016.12.31 23:00:00之后这4人的第一场比赛，这场比赛的积分为5倍pt数' + '<br>';
  str = str + '' + '<br>';
  str = str + '' + '<br>';
  str = str + '奖品：' + '<br>';
  str = str + '第一名：DMM3000点点卡或30元红包' + '<br>';
  str = str + '第二名：DMM2000点点卡或20元红包' + '<br>';
  str = str + '第三名：DMM1000点点卡或10元红包' + '<br>';
  return str;
}





function test(){
  adduser("111","地獄之鴉");
  adduser("222","无序");
  adduser("333","No.Zero");
  adduser("444","Flandre2");
  adduser("555","Pau");
  adduser("666","blueの時空");
}





module.exports = app;



























