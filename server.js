var http = require('http');
var fs = require('fs');
var express = require('express');
var app = express();
var axios = require('axios');
var mysqlConfig = require('./mysql_config.js');
var dbPool = mysqlConfig.dbPool;
var session = require('express-session');
var url = require('url');
var bodyParser = require('body-parser');
var request = require("request");
var ipfsAPI = require('ipfs-api')
var buffer = require('buffer')
var session = require('express-session');
var formidable = require('formidable');
var multer = require('multer');
var expect = require('expect')
var ipfs = ipfsAPI('localhost','5001',{protocol:'http'})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.engine('html',require('ejs').renderFile);
app.set('view engine','html');
app.set('views','views');

var balance = 0;
var upload = multer({dest:'./uploads/'})

/*
//세션 관리
app.use(session({
   key: 'sid',
   secret: 'keyboard cat',
   resave: false,
   saveUninitialized: true,
   cookie: {
      maxAge: 24000 * 60 * 60 // 쿠키 유효기간 24시간
   }
}));
*/

// ipfs upload func

/*
// getBalanc func
function getBalance(addr){
   axios.get('http://localhost:2442/api/v1/wallet/'+addr+'/balance')
   .then((response) => {
      var balance = response.data.balance;
      console.log(balance);
   }).catch((err) => {console.log("AXIOS ERROR: ", err);})
   return balance;
};
*/

// main page
app.route('/')
  .get(function(req,res) {

    return res.render('index');
  })
  .post(upload.single('userfile'),function(req,res){
    //console.log(req.file);
    var file_data = req.file
    let testFile = fs.readFileSync('./uploads/'+file_data['filename']);
    let testBuffer = new Buffer(testFile)

    ipfs.files.add(testBuffer,function(err,hash){
      if(err) throw err;
      const data = hash[0]
      ipfs_hash = data.hash
      file_name = file_data['filename']
      var sqlsetMemReg = 'insert into data(file_name,ipfs_hash) values("'+file_name+'","'+ipfs_hash+'")';
      dbPool.getConnection(function(err, dbConnection) {
          if(err){
             dbConnection.release();
             console.log('ERROR: CANNOT CONNECT Mysql');
             console.log(err);
             response.status(500).send('Internal Server Error');
          }else{
             dbConnection.query(sqlsetMemReg, function(err, result, fields) {
                if(err) {
                   dbConnection.release();
                   console.log('ERROR: CANNOT QUERY Mysql');
                   console.log(err);
                } else {
                   dbConnection.release();
                }
             });
          }
       });
      return console.log(hash)})
    return res.render('index')
  });

app.post('/show',function(req,res){
  var sqlsetMemReg = 'select ipfs_hash from data';

  dbPool.getConnection(function(err, dbConnection) {
      if(err){
         dbConnection.release();
         console.log('ERROR: CANNOT CONNECT Mysql');
         console.log(err);
         response.status(500).send('Internal Server Error');
      }else{
         dbConnection.query(sqlsetMemReg, function(err, result, fields) {
            if(err) {
               dbConnection.release();
               console.log('ERROR: CANNOT QUERY Mysql');
               console.log(err);
            } else {
               dbConnection.release();
               console.log(typeof result);
               res.json(result);
             }
         });
      }
   });
})



/*
app.post('/upload',upload.single('userfile'),function(req,res){
  console.log(req.file);

  let testFile = fs.readFileSync('gizmo.mp4');
  let testBuffer = new Buffer(testFile)
  var upload = function(){
    ipfs.files.add(testBuffer,function(err,hash){
    if(err) throw err;
    var data = JSON.stringify(hash)
  return res.redirect('index')

      }
    )
  }
})
*/

  /*
  var obj = {"uid": req.session.uid, "addr": req.session.addr, "name": req.session.username};
  if(!req.session.addr){
  } else {
     console.log(getBalance(req.session.addr));
     return res.render('index',{session:req.session.uid})
  }
  */

/*
// 로그인
app.get('/login', function(req, res){
   if(!req.session.addr){
      console.log("login_if : "+req.session.uid);
      res.render('login');
   } else {
      console.log("login_else : "+req.session.uid);
      res.redirect('/');
   }
});
app.post('/login', function(req, res){
   var id = req.body.id;
   var pw = req.body.pw;
   var sqlLogin = 'select * from user where id = "'+id+'" and pw = "'+pw+'"';
   dbPool.getConnection(function(err, dbConnection) {
      if(err){
         dbConnection.release();
         console.log(err);
         response.status(500).send('Internal Server Error');
      }else{
         dbConnection.query(sqlLogin, function(err, result, fields) {
            if(err) {
              dbConnection.release();
              console.log('ERROR: CANNOT QUERY Mysql');
              console.log(err);
              res.status(500).send('Internal Server Error');
            } else {
               var result= result;

               if(result == ''){
                  res.send('<script type="text/javascript">alert("오류발생");location.href="/login.html";</script>');
                  return false;
               }
               req.session.uid = result[0].id;
               req.session.username = result[0].name;
               req.session.addr = result[0].addr;
               console.log("login_id : "+result[0].addr);
               console.log("login_session : "+req.session.addr);
               console.log("login_session : "+req.session.uid);
               req.session.save(() => {
                  res.redirect('/');
               });
               dbConnection.release();
            }
         });
      }
   });
});
// Logout
app.get('/logout', (req, res) => {
   delete req.session.uid;
   delete req.session.username;
   delete req.session.addr;
   console.log("logout : "+req.session.addr);
   req.session.save(() => {
      res.redirect('/login');
   });
});

// 회원가입
app.get('/signup', function(req,res){
   if(!req.session.addr){
      console.log("signup_if : "+req.session.addr);
      res.render('signup');
   } else {
      console.log("signup_else : "+req.session.addr);
      res.redirect('/');
   }
});
app.post('/signup', function(req,res){
   var id = req.body.id;
   var pw = req.body.pw;
   var name = req.body.name;
   var phone = req.body.phone;
   var email = req.body.email;
   //var addr;
   var postData = {
   };
   let axiosConfig = {
      headers: {
         'Content-Type': 'application/json'
      }
   };
   axios.post('http://localhost:2442/api/v1/wallet/', postData, axiosConfig)
   .then((response) => {
      console.log("addr1: ", response.data.address);
      addr = response.data.address;
      console.log("addr2: ", addr);
      var sqlsetMemReg = 'insert into user(id, pw, name, email, phone, addr) values("'+id+'", "'+pw+'", "'+name+'", "'+email+'", "'+phone+'", "'+addr+'")';
      dbPool.getConnection(function(err, dbConnection) {
         if(err){
            dbConnection.release();
            console.log('ERROR: CANNOT CONNECT Mysql');
            console.log(err);
            response.status(500).send('Internal Server Error');
         }else{
            dbConnection.query(sqlsetMemReg, function(err, result, fields) {
               if(err) {
                  dbConnection.release();
                  console.log('ERROR: CANNOT QUERY Mysql');
                  console.log(err);
                  res.status(500).send('Internal Server Error');
               } else {
                  dbConnection.release();
                  console.log('fields: ' + fields);
                  console.log({"results": result});
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.status(200);
                  res.send({"results": result});
               }
            });
         }
      });
      fs.readFile('./views/login.html', function(error, data){
         if(error){
            console.log(error);
         }else{
            res.writeHead(200, {'Context-Type':'text/html'});
            res.end(data);
         }
      });
   })
   .catch((err) => {
      console.log("AXIOS ERROR: ", err);
   });
});
*/
app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
