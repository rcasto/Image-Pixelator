var express = require('express');
var path = require('path');

var app = express();
var port = process.env.PORT || 4000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));

app.get('/', function (req, res) {
  res.sendFile('testHost.html');
});

app.listen(port, function () {
  console.log('Server started on port:', port);
});