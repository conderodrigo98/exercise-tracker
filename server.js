var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require("body-parser");

var app = express();

var cors = require('cors');

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);

var Schema = mongoose.Schema;
var userSchema = new Schema({
  username: String,
  logs: Array
});

var Users = mongoose.model('Users', userSchema);

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// Not found middleware
//app.use((req, res, next) => {
  //return next({status: 404, message: 'not found'})
//});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});




//create a new user
app.post("/api/exercise/new-user", function(req,res){
  console.log(req.body.username);
  var user = req.body.username.toString();
  if(user === ""){
    res.json({ERROR: "You must enter a username"});
  }else{
    Users.find({username: user}, function(err,data){
      if(data.length == 0){
        var newUser = new Users({username: user, logs : []});
        newUser.save(function(err,data){
          console.log(data);
          res.json({username:user, _id:data._id});
        });
      }else{
        res.json({ERROR: "Username already taken"});
      }
    });
  }
});


//add an exercise log
app.post("/api/exercise/add",function(req,res){
  console.log(req.body);
  var uId = req.body.userId.toString();
  var des = req.body.description.toString();
  var dur = req.body.duration.toString();
  if (req.body.date.length == 0){
    console.log("vacio");
    var dat = new Date();
  }else
    var dat = new Date(req.body.date.toString());
  if (uId == "" || des == "" || dur == ""){
    res.json({ERROR: "You must complete all required fields"});
  }else if (dat == "Invalid Date"){
    res.json({ERROR: "Invalid Date"});
  }else{
    Users.findById(uId, function(err,data){
      console.log("Update?",data);
      if (data === undefined || data === null){
        res.json({ERROR: "There's no user with that Id"});
      }else{
        var exercise = {
          description: des,
          duration: dur,
          date: dat,
        };
        console.log("exercise=",exercise);
        data.logs.push(exercise);
        console.log("data antes de save",data);
        data.markModified('logs');
        data.save();
        res.json({"username":data.username,"description":des,"duration":dur,"_id":uId,"date":dat.toDateString()});
      }
    });
  }
});

//get user's log
app.get("/api/exercise/log?",function(req,res){
  console.log("query",req.query);
  Users.findById(req.query.userId.toString(),function(err,data){
    if (data === undefined || data === null){
      res.json({ERRROR: "There's no user witht that Id"});
    }else{
      if(req.query.from === undefined){
        var from = new Date(0);
      }else{
        var from = new Date(req.query.from.toString());
        console.log("from=",from);
        if(from == "Invalid Date"){
          res.json({ERROR:"Invalid Date"});
        }
      }
      if(req.query.to === undefined){
        var to = new Date();
      }else{
        var to = new Date(req.query.to.toString());
        if(to == "Invalid Date"){
          res.json({ERROR:"Invalid Date"});
        }
      }
      if(req.query.limit === undefined){
        var l = data.logs.length;
      }else if(isNaN(Number(req.query.limit.toString()))){
        console.log("ENTRE");
        res.json({ERROR: "Invalid limit"});
      }else if (data.logs.length<Number(req.query.limit.toString())){
        l = data.logs.length;
      }else{
        var l = Number(req.query.limit.toString());
      }
      var log=[];
      var i = 0;
      var count = 0;
      while(i<data.logs.length && count<l){
        console.log("fecha1=",data.logs[i].date," comparacion",data.logs[i].date >= from,data.logs[i].date <= to);
        if(data.logs[i].date >= from && data.logs[i].date <= to){
          log.push(data.logs[i]);
          count++;
        }
        i++;
      }
      res.json({_id: data._id, username: data.username, count: log.length, log: log});
      //}
    }
  });
  
});

app.get("/api/exercise/users",function(req,res){
  Users.find({},function(err,data){
    res.json(data);
  });
});