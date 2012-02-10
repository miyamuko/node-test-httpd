/**
 * Module dependencies.
 */

var express = require('express')

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser({uploadDir: __dirname + "/uploads"}));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});


// Routes

app.all('/snoop', function(req, res) {
    var status = req.param("status") || 200;
    console.log("snoop " + status);
    var r = {
        method: req.method,
        headers: req.headers,
        query: req.query,
        body: req.body,
        files: req.files,
    };
    console.log(r);
    res.json(r, null, status);
});

app.all("/timeout", function(req, res, next) {
    var dt = req.param("t") || 30;
    console.log("timeout " + dt);
    setTimeout(function () {
        res.json({ "delay": dt });
    }, dt * 1000);
});

app.all('/redirect', function(req, res) {
    var to = req.param("url") || "/snoop";
    var status = req.param("status") || "302";
    console.log("redirect %s -> %s", status, to);
    res.redirect(to, status);
});

app.all("/disconnect", function(req, res, next) {
    console.log("disconnect");
    res.destroy();
});

app.all('/chunked', function(req, res) {
    var status = req.param("status") || "200";
    var interval = parseInt(req.param("interval") || "500");
    var n = parseInt(req.param("n") || "9");

    console.log("chunked %s (n=%s, interval=%s)", status, n, interval);
    var send_chunk = function(res, n) {
        setTimeout(function() {
            var chunk = "chunk data " + n + "\n";
            if (n == 0) {
                console.log("End chunk: %d", n);
                res.end(chunk);
            } else {
                console.log("Send chunk: %d", n);
                res.write(chunk);
                send_chunk(res, n - 1);
            }
        }, interval);
    };

    setTimeout(function() {
        res.writeHead(status, {
            'Content-Type': 'text/plain',
            'Transfer-Encoding': 'chunked',
        });
        send_chunk(res, n);
    }, interval);
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
