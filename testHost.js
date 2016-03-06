var express = require('express');
var path = require('path');

var app = express();
var port = process.env.PORT || 4000;

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'public/testHost.html'));
});

app.listen(port, function () {
    console.log('Server started on port:', port);
});