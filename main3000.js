  var redis = require('redis')
  var multer  = require('multer')
  var express = require('express')
  var fs      = require('fs')
  var http = require('http')
  var httpProxy = require('http-proxy')
  var app = express()
  // REDIS
  var client = redis.createClient(6379, '127.0.0.1', {})

  //
  // HTTP SERVER
  var server = app.listen(3000, function () {
   var host = server.address().address
   var port = server.address().port
   console.log('Example app listening at http://%s:%s', host, port)
  })

  ///////////// WEB ROUTES

  // Add hook to make it easier to get all visited URLS.
  app.use(function(req, res, next)
  {
  	client.lpush("RecentList",req.protocol + "://" + req.get('host') + req.originalUrl, function(err, reply){
  //  console.log("RecentList",req.protocol + "://" + req.get('host') + req.originalUrl);
  	client.ltrim("RecentList",0,4);
  })
  	next(); // Passing the request to the next handler in the stack.
  });

  app.get('/', function (req, res) {
  		 res.send("Welcome to port 3000");
  });

  app.get('/set', function (req, res) {
  	client.set("key", "this message will self-destruct in 10 seconds");
  	client.expire("key",10);
  	res.send('Key is set on port 3000');
  });

  app.get('/get', function (req, res) {
  		client.get("key", function(err,value){
  			console.log('The value is: ' + value);
  		 res.send('The value of key on port 3000 is: ' + value)});
  });


  app.get('/recent', function(req, res) {
  client.lrange("RecentList",0,4,function(err,val){
  	res.send(val);
  })
  })


  app.post('/upload',[ multer({ dest: './uploads/'}), function(req, res){
      console.log(req.body) // form fields
      console.log(req.files) // form files

      if( req.files.image )
      {
   	   fs.readFile( req.files.image.path, function (err, data) {
   	  		if (err) throw err;
   	  		var img = new Buffer(data).toString('base64');
   	  		console.log(img);
   	  		client.rpush("images",img)
   		});
   	}

      res.status(204).end()
       }]);

  app.get('/meow', function(req, res) {
   		client.lpop("images",function(err,val){
   	    if(err) throw err;
   	    res.writeHead(200, {'content-type':'text/html'});
   		res.write("<h1>\n<img src='data:my_pic.jpg;base64,"+val+"'/>");
          res.end();
   		})
   })
