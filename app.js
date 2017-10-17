var express = require('express');
var app = express();
var path = require('path');
var AWS = require('aws-sdk');
var bodyParser = require('body-parser');
var getmac = require('getmac');
var clientIp = require('client-ip');
var requestIp = require('request-ip');
var multiparty = require('connect-multiparty'),
    multipartyMiddleware = multiparty();
var get_ip = require('ipware')().get_ip;
var fs = require('fs');

var jwt = require('jsonwebtoken');

app.use(function(req, res, next) {
    var ip_info = get_ip(req);
    // console.log(ip_info);
    // { clientIp: '127.0.0.1', clientIpRoutable: false }
    next();
});

app.use(express.static('public'));
app.set('views', __dirname + '/public');
app.engine('html', require('ejs').renderFile);

app.use(express.static(path.join(__dirname)));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/', function(req, res) {
    //res.sendfile('indexdefault.html', { root: __dirname + "/" }) ;
    res.sendfile('index.html', { root: __dirname + "/" });
});

app.post('/deleteDownloads3imageFolder', function(req, res) {
    var fs = require('fs');
    var pathdir = path.join(__dirname, 'DownloadPhotos');
    if (fs.existsSync(pathdir)) {
        removeFolder(pathdir);
    }
    res.end();
});

app.use(function(req, res, next) { //allow cross origin requests
    res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    next();
});

// route to authenticate a user(POST http: //localhost:8080/api/authenticate)
app.post('/authenticate', function(req, res) {
    var payload = {
        username: req.body.username,
        custid: req.body.custid
    };

    var token = jwt.sign(payload, "Kaakateeya", {
        expiresIn: 1440 // expires in 24 hours
    });
    tokenval = token;
    res.json({
        success: true,
        message: 'Enjoy your token!',
        token: token
    });

});
app.post('/getTempToken', function(req, res) {
    var payload = {
        // source: 'KaakateeyaAPP'
        source: req.body.source
    };

    var token = jwt.sign(payload, "Kaakateeya", {
        expiresIn: 3440 // expires in 24 hours
    });
    tokenval = token;
    res.json({
        success: true,
        message: 'Enjoy your token!',
        token: token
    });

});


app.use(function(req, res, next) {
    res.setHeader("Access-Control-Allow-Methods", "POST, PUT, PATCH, DELETE, GET");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});
var token = '';
app.use('/Api', function(req, res, next) {
    var request = require('request');
    if (req.method != 'OPTIONS') {
        if (req.headers.authorization && req.headers.authorization.indexOf('Bearer') != -1) {
            token = req.headers.authorization.replace('Bearer', '').trim();
            if (token) {
                jwt.verify(token, "Kaakateeya", function(err, decoded) {
                    if (err) {
                        return res.status(403).send({
                            success: false,
                            message: 'UnAuthorized Request'
                        });
                    } else {
                        req.decoded = decoded;
                        //parameters:custid = decoded:custid
                        if (req.method === 'GET') {
                            request('http://183.82.0.58:8010/Api' + req.url,
                                function(error, response, body) {
                                    if (!error && response.statusCode == 200) {
                                        res.write(body);
                                        res.end();
                                    }
                                });
                        } else {
                            request.post({
                                url: 'http://183.82.0.58:8010/Api' + req.url,
                                headers: {
                                    'Authorization': 'Bearer ' + token,
                                    'Accept': 'application/json'
                                },
                                form: req.body
                            }, function(error, response, body) {
                                res.write(body);
                                res.end();
                            });
                        }
                    }
                });


            }
        } else {
            return res.status(403).send({
                success: false,
                message: 'UnAuthorizated Requst'
            });
        }
    } else {
        if (req.method === 'GET') {
            request('http://183.82.0.58:8010/Api' + req.url,
                function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        res.write(body);
                        res.end();
                    }
                });
        } else {
            request.post({
                url: 'http://183.82.0.58:8010/Api' + req.url,
                headers: {
                    'Accept': 'application/json'
                },
                form: req.body
            }, function(error, response, body) {
                res.write(body);
                res.end();
            });
        }
    }

});

app.listen(3000, function() {
    console.log('Example app listening on port 3000....!');
});