#!/bin/env node
var app = require('express.io')();
var express = require('express.io');
var fs = require('fs');

var votes = [];
var users = 0;
var global_error = "";
var mongojs = require('mongojs');

var connection_string = "";

if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
  connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
  process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
  process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
  process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
  process.env.OPENSHIFT_APP_NAME;
}
var db = mongojs(connection_string, ['langs']);
var langs = db.collection('langs');
db.langs.find({}).forEach(function(err, doc) {
  if (doc) {
    votes.push(doc);
  }
});

function upvote(lang_name){
    for(var i = 0; i < votes.length; i++){
        if(votes[i].name === lang_name){
            votes[i].votes++;
        }
    }

    db.langs.update({name:lang_name}, {$inc:{votes:1}}, {multi:false}, function() {
        // the update is complete
        app.io.broadcast('refresh'); //to the client
    });
}

function downvote(lang_name){
    for(var i = 0; i < votes.length; i++){
        if(votes[i].name === lang_name){
            votes[i].votes--;
        }
    }

    db.langs.update({name:lang_name}, {$inc:{votes:-1}}, {multi:false}, function() {
        // the update is complete
        app.io.broadcast('refresh'); //to the client

    });
}

app.http().io()
//build your realtime-web app
var ipaddress = process.env.OPENSHIFT_NODEJS_IP;
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

app.use(express.cookieParser())
app.use(express.session({secret: 'mdRK2jzpOl6MkOcnzFhnXVsIQji88Moq7vau1gNl'}))
app.use(express.static(__dirname + '/public'));


app.io.route('vote', function(req) {
  var found = false;
  var found_index = -1;
  for(var i = 0; i < votes.length; i++){
    if(req.data === votes[i].name){
      found = true;
      found_index = i;
    }
  }

  if(found){

    //ok, so you voted. and it's valid
    var prev = req.session.vote;
    if(req.data === prev){
      //ok, so you undid it
      req.session.vote = null; //now you have no vote
      req.session.save(function(){
        downvote(req.data);
      });
    }
    else{
      //no, you chose something else
      var old_lang = req.session.vote;
      req.session.vote = req.data;
      req.session.save(function(){
        //updated!
        upvote(req.data);
        downvote(old_lang);
      });
    }

  }
  // req.io.emit('data', votes);
  //app.io.broadcast('refresh'); //to the client
  //req.io.broadcast('refresh'); //not to the client

  //increment

});
app.io.route('ready', function(req) {
  req.io.emit('refresh');
});
app.io.route('data', function(req) {
  req.io.emit('data', votes);
});

//TO
//REMOVE
//LATER
app.io.route('get', function(req) {
  req.io.emit('get', [req.session, req.session.vote]);
});
//TO
//REMOVE
//LATER


app.get('/votes', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(votes));
});

app.get('/users', function(req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.send('<html><body>' + users + '</html></body>');
});

app.get('/error', function(req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.send('<html><body>' + global_error + '</html></body>');
});

app.listen(port, ipaddress, function(){});
