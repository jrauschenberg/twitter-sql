'use strict';
var express = require('express');
var router = express.Router();
var tweetBank = require('../tweetBank');
var models = require('../models')

module.exports = function makeRouterWithSockets (io) {

  // a reusable function
  function respondWithAllTweets (req, res, next){
    models.Tweet.findAll({ include: [models.User]})
    .then(function(tweets) {
      res.render('index', {
      title: 'Twitter.js',
      tweets: tweets,
      showForm: true
    })
    });
  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){
    models.User.findOne(
      {where: { name : req.params.username },
      include: [models.Tweet]
    }).then(function(user) {
      for (var i=0; i<user.Tweets.length; i++) {
        user.Tweets[i].User = {};
        user.Tweets[i].User.name = req.params.username;
      }
      res.render('index', {
      title: 'Twitter.js',
      tweets: user.Tweets,
      showForm: true,
      username: req.params.username
      })
    });
  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    models.Tweet.findOne(
      {where: { id : req.params.id },
      include: [models.User]
    }).then(function(tweet) {
      res.render('index', {
      title: 'Twitter.js',
      tweets: [tweet],
      showForm: true
      })
    });
  });

  // create a new tweet
  router.post('/tweets', function(req, res, next){
    models.User.findOrCreate({
      where: {name : req.body.name}
    // left with user id if created or found
    }).then(function (user) {
    console.log(JSON.stringify(user));
      models.Tweet.create({
    // need to make sure that the fields are the same (check database)
        where : { UserId: user.id, tweet: req.body.text}
      })
    res.redirect('/');
    })
    var newTweet = {name: req.body.name, tweet: req.body.text};
    io.sockets.emit('new_tweet', newTweet);
  });

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
