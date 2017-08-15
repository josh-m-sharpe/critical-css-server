var express = require('express');
var extend = require('extend');
var redis = require('redis');
var redisOpts = require('./redisOpts.js');
var QueueBuildRequests = require('./workers/QueueBuildRequests.js');
var requireHeader = require('./middleware/requireHeader.js');
var requireNestedParams = require('./middleware/requireNestedParams.js');

var bull = require('bull');
var bodyParser = require('body-parser');

var defaults = {
  redis: redis.createClient(redisOpts),
  queue: bull('CriticalPath Generator', process.env.REDIS_URL, redisOpts.options)
};

function prepareApp(config) {
  var app = express();
  var options = extend(defaults, config);
  var worker = new QueueBuildRequests(options.redis, options.queue);

  app.use(bodyParser.json());

  app.post('/api/v1/css',
    requireHeader('Content-Type', 'application/json'),
    requireNestedParams('page', ['key', 'url', 'css']),

    function (req, res) {
      console.log(req.body.page);
      worker.perform(req.body).then(function (item) {
        if (item.attributes.content) {
          res.send(item.attributes.content);
        } else {
          res.status(202).send('Accepted');
        }
      }).catch(function (e) {
        console.log(e);
        res.sendStatus(500);
      });
    }
  );

  return app;
}

module.exports = prepareApp;
