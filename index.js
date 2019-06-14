const express = require('express');

const app = express();

app.set("view engine",'ejs');

app.use(express.static('./public'));

var session = require('express-session');
var flash=require('connect-flash');

app.use(require('connect-flash')());

app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
}));

var bodyParser=require('body-parser');

var urlencodedParser=bodyParser.urlencoded({extended: false});

app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

var mongoose=require('mongoose');

mongoose.connect('mongodb://localhost/auth_plate');

var db = mongoose.connection;

const bcrypt=require('bcryptjs');

var UserSchema = new mongoose.Schema({
	name:String,
	email:String,
	password:String,
	date:Date
});

const User= mongoose.model('User',UserSchema,'User');

app.get('/',function(req,res){
	res.render('welcome');
});

app.get('/users/register',function(req,res){
	res.render('register',{errors:[],name:'',email:'',password:'',password2:''});
});

app.get('/users/login',function(req,res){
	res.render('login');
});

app.post('/users/register',urlencodedParser,function(req,res){
	const {name , email , password , password2} = req.body;
    var errors = [];

	if(!name || !email || !password || !password2){
		errors.push({msg:'Please fill the fields'});
	}

	if( password !== password2){
		errors.push({msg:'Passwords do not match'});
	}

	if( password.length < 6){
		errors.push({msg:'Password should be atleast 6 characters'});
	}

	if(errors.length > 0){
		res.render('register',{errors,name,email,password,password2});
	}
	else
	{
		var query={email:email};
		User.find(query,function(err,data){
			if(err || data.length ==0){
				bcrypt.genSalt(10,function(err,salt){
					bcrypt.hash(password,salt,function(err,hash){
						if(err) throw err;
						pwd=hash;
						const usr1 = User({name:name,email:email,password:pwd,date:new Date()}).save(function(err){
							if(err) throw err;
						    });
					})
				});
				req.flash('info','You are now registered and can log in');
 				res.redirect('/users/login');
			}
			else{
				if(data.length>0){
					console.log(data);
				errors.push({msg:'User exists'});
				res.render('register',{errors,name,email,password,password2});
			}}
		});
	}
});

app.listen('8080');