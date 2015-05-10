var path = require("path");
var fs = require('fs');
var OAuth= require('oauth').OAuth;
var config = require('../oauth.js')
var util = require('util');
var Twitter = require('node-twitter');
var mysql = require('mysql');
var http = require('http');
var https = require('https');

var twitter = require('twitter');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Hamburger123!',
});
connection.connect(function(err) {
    // connected! (unless `err` is set)
    if (err) {
        console.log('mysql error: ', err);
        return false;
    }
});

exports.registerrfid = function(req, res) {
    //req.session.testShit = 'this is a value';
    res.render('registerrfid', {title: "Take a Picture - reged"});
};

exports.register = function(req, res) {
    //req.session.newKeyViral = 'mehta';
    req.session.name = "this be da session name";
    res.render('register', {title: "Take a Picture - start"});
};
exports.ping = function(req, res) {
    res.send("pong!", 200);
};
exports.twittertest = function(req, res) {


        var sql = "SELECT twitter_authtoken,twitter_authtoken_secret FROM picture_taker.config LIMIT 1";
var twitter_access_token = '';
var twitter_authtoken_secret = '';
connection.query(sql, function(err, rows) {
    twitter_access_token = rows[0].twitter_authtoken;
    twitter_authtoken_secret = rows[0].twitter_authtoken_secret;

        var fileName = '/var/www/eyefi/pix/DSC00271.JPG';
        var tweet = 'the is raja';
        var photoName = 'DSC00271.JPG';
        var data = fs.readFileSync(fileName);
        var oauth = new OAuth(
                'https://api.twitter.com/oauth/request_token',
                'https://api.twitter.com/oauth/access_token',
                 config.twitter.consumerKey,  config.twitter.consumerSecret,
                '1.0', null, 'HMAC-SHA1');

        var crlf = "\r\n";
        var boundary = '---------------------------10102754414578508781458777923';

        var separator = '--' + boundary;
        var footer = crlf + separator + '--' + crlf;
        var fileHeader = 'Content-Disposition: file; name="media[]"; filename="' + photoName + '"';

        var contents = separator + crlf
                + 'Content-Disposition: form-data; name="status"' + crlf
                + crlf
                + tweet + crlf
                + separator + crlf
                + fileHeader + crlf
                + 'Content-Type: image/jpeg' + crlf
                + crlf;

        var multipartBody = Buffer.concat([
            new Buffer(contents),
            data,
            new Buffer(footer)]);

        var hostname = 'api.twitter.com';
        var authorization = oauth.authHeader(
                'https://api.twitter.com/1.1/statuses/update_with_media.json',
                 config.twitter.accessToken,  config.twitter.accessTokenSecret, 'POST');

 var authorization = oauth.authHeader(
                'https://api.twitter.com/1.1/statuses/update_with_media.json',
                 twitter_access_token,  twitter_authtoken_secret, 'POST');


        var headers = {
            'Authorization': authorization,
            'Content-Type': 'multipart/form-data; boundary=' + boundary,
            'Host': hostname,
            'Content-Length': multipartBody.length,
            'Connection': 'Keep-Alive'
        };

        var options = {
            host: hostname,
            port: 443,
            path: '/1.1/statuses/update_with_media.json',
            method: 'POST',
            headers: headers
        };

        var request = https.request(options);
        request.write(multipartBody);
        request.end();

        request.on('error', function(err) {
            console.log('Error: Something is wrong.\n' + JSON.stringify(err) + '\n');
        });

        request.on('response', function(response) {
            response.setEncoding('utf8');
            response.on('data', function(chunk) {
                console.log(chunk.toString());
            });
            response.on('end', function() {
                console.log(response.statusCode + '\n');
                
            });
        });
        res.send("twitter test!", 200);

//
//  var tconfig = {
//    consumer_key: config.twitter.consumerKey,
//    consumer_secret: config.twitter.consumerSecret,
//    access_token_key: config.twitter.accessToken,
//    access_token_secret: config.twitter.accessTokenSecret
//};
//

    
//  var tconfig = {
//    consumer_key: config.twitter.consumerKey,
//    consumer_secret: config.twitter.consumerSecret,
//    access_token_key: twitter_access_token,
//    access_token_secret: twitter_authtoken_secret
//};
//    console.log(tconfig);
//    var twit = new twitter(tconfig);
//    
//    twit
//    .verifyCredentials(function(data) {
//        console.log(util.inspect(data));
//    })
//    .updateStatus('Test tweet from node-twitter/' + twitter.VERSION,
//        function(data) {
//            console.log(util.inspect(data));
//            res.send("twitter test!", 200);
//        }
//    );

    
    });
};

        