var magenta = '\u001b[35m';
var green = '\u001b[32m';
var red = '\u001b[31m';
var reset = '\u001b[0m';

var port = 3000;
//var express = require('express');
//MemoryStore = express.session.MemoryStore;
//
//var app = express();
//var server = require('http').createServer(app)
//
//var session_store = new MemoryStore();

var currentRfid = '';

var KEY = 'express.sid'
        , SECRET = 'express';

var express = require('express')
        , app = express()
        , server = require('http').createServer(app)
        , io = require('socket.io').listen(server)
        , cookie = express.cookieParser(SECRET)
        , store = new express.session.MemoryStore()
        , session = express.session({secret: SECRET
            , key: KEY
            , store: store});



var config = require('./oauth.js')
var fs = require('fs');
var routes = require('./routes');
var path = require('path');
var passport = require('passport')
var mysql = require('mysql');
var sys = require('sys')
var exec = require('child_process').exec;
var Tail = require('tail').Tail;
var http = require('http');
var listenToRfid = false;


//postRegistrationData(123,{this:'is',a:'test'});
//return false;


//var io = null;
console.log('about to call listen');
server.listen(port, function() {
    console.log(magenta + 'server started and listening on port ' + port + reset);
    //io = require('socket.io').listen(server);

});


var nfc_eventdInt = setInterval(function() {
    try {
        var tail = new Tail("/tmp/rfid_RC522.log");
        var rfid = '';
        clearInterval(nfc_eventdInt);
        tail.on("line", function(data) {
            console.log(data);

            if (data.search('SNlen=4 SN=') !== -1) {
                console.log('detected rfid');
                //rfid = data.substring(data.lastIndexOf("=") + 1, data.lastIndexOf(")"));
                rfid = data.substring(data.lastIndexOf("=") + 2, data.lastIndexOf("]"));
                rfid = parseInt('0x' + rfid)
                //io.sockets.emit('nfcevent', rfid);
                currentRfid = rfid;

                    var packet = {
                        msg: 'Thank you. You may now link your wristband with your favorite social networking sites.',
                        showSocial: true,
                        rfid: rfid,
                        alreadyLinked: false
                    }

                    io.sockets.emit('nfcevent', packet);
  //              });

            }
            //console.log(data);
        });
    } catch (e) {
        console.log('error checking for /tmp/rfid_RC522.log - socialauth');

    }
}, 2000);

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

var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;



// serialize and deserialize
passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

// config
passport.use(new FacebookStrategy({
    clientID: config.facebook.clientID,
    clientSecret: config.facebook.clientSecret,
    callbackURL: config.facebook.callbackURL,
    profileFields: ['id', 'displayName', 'photos']
},
function(accessToken, refreshToken, profile, done) {
    console.log('accessToken ', accessToken, ' profile ', profile);

//    var sql = "UPDATE picture_taker.config SET fb_authtoken='" +
//            accessToken + "'";
//
//    connection.query(sql);

    sql = "UPDATE picture_taker.users SET ?, facebook_time=NOW() WHERE rfid='"+currentRfid+"'";

    var fbdata = {accessToken: accessToken, profile: profile};
    fbdata = JSON.stringify(fbdata);

    connection.query(sql, {facebook_data: fbdata})


    process.nextTick(function() {
        return done(null, profile);
    });
}
));



passport.use(new TwitterStrategy({
    consumerKey: config.twitter.consumerKey,
    consumerSecret: config.twitter.consumerSecret,
    callbackURL: config.twitter.callbackURL,
    profileFields: ['id', 'displayName', 'photos'],
    passReqToCallback: true
},function(req,accessToken,accessTokenSecret, profile, done){

    req.session.twitter={};
    req.session.twitter.accessToken = accessToken;
    req.session.twitter.accessTokenSecret=accessTokenSecret;
    req.session.twitter.profile=profile;

    process.nextTick(function() {
        return done(null, profile);
    });
}));



connection.on('error', function(err) {
    console.log('there was a mysql error',err);
    return;
});

app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(function(req, res, next) {
        console.log('%s %s', req.method, req.url);
        next();
    });

    app.use(cookie);
    app.use(session);
    //app.use(express.logger());
    //app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    //app.use(express.session({secret: COOKIE_SECRET, key: 'connect.sid', store: session_store}));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});



// routes
app.get('/', routes.register);
app.get('/registerrfid', function(req, res) {
    listenToRfid = true;
    res.render('registerrfid', {title: "Take a Picture - reged"});
});

app.get('/ping', routes.ping);
app.get('/twittertest', routes.twittertest);
app.get('/account', function(req, res) {
    res.render('account', {user: req.user});
});

app.get('/', function(req, res) {
    req.session.name = "this be da session name";
    res.render('login', {user: req.user});
});

app.get('/auth/facebook',
        //passport.authenticate('facebook', {scope: ['user_status', 'user_checkins', 'user_about_me', 'publish_actions', 'publish_stream', 'user_likes']}),
         passport.authenticate('facebook', {scope: ['user_status', 'user_about_me', 'publish_actions', 'user_likes']}),
function(req, res) {
});
app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {failureRedirect: '/'}),
function(req, res) {
    res.redirect('/socialize');
});


app.get('/auth/twitter',
        passport.authenticate('twitter'),
        function(req, res) {
        });
app.get('/auth/twitter/callback',
        passport.authenticate('twitter', {failureRedirect: '/'}),
function(req, res) {
    res.redirect('/socialize');
});

app.get('/socialize', function(req, res) {
    console.log('the session data is ', req.session);
    var s=req.session;
    var sdata = {
        facebook_data: s.facebook!=null?JSON.stringify(s.facebook):null,
        facebook_time:null,
        pending:0,
        rfid: null,
        twitter_data: JSON.stringify(s.twitter),
        twitter_time:null,
        user_id:1

    };

    console.log('sdata',sdata);
    res.render('socialize', {pageData: JSON.stringify(sdata)});

});


app.get('/completesocialize', function(req, res) {
    console.log('socializing complete');
    var s = req.session;
    var data = {twitter_data: s.twitter, facebook_data: s.facebook}
    postRegistrationData(currentRfid, data, function(){
        res.redirect('/');
    });

    //res.render('completesocialize');

});


app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});



io.set('authorization', function(data, accept) {
    cookie(data, {}, function(err) {
        if (!err) {
            var sessionID = data.signedCookies[KEY];
            store.get(sessionID, function(err, session) {
                if (err || !session) {
                    accept(null, false);
                } else {
                    data.session = session;
                    accept(null, true);
                }
            });
        } else {
            accept(null, false);
        }
    });
});


io.sockets.on('connection', function(socket) {
      var session = socket.handshake.session
            , name = session.name;
            
    console.log("Establishing new connection", session);
  
    socket.on('unlinkSocial', function(data) {
        var type = data.type;
        var rfid = data.rfid;
        console.log('client has requested to be unlinked from ', type);

        unlinkSocial(rfid, type);

    });

    socket.on('message', function(msg) {
        console.log('Message Received: ', msg);
        socket.broadcast.emit('write', msg);
    });
    socket.on('addtofb', function(info) {
        var filename = '/var/www/eyefi/pix/' + info.filename.trim();
        var msg = info.msg;
        console.log('you want to upload ', filename, ' to facebook');
        postToFB(msg, filename);
    });
    socket.on('addtotwitter', function(info) {

        console.log('you want to upload ', filename, ' to twitter');

    });
    socket.on('write', function(msg) {
        console.log('received message from socket ' + socket.id + ': ', msg);

    })
    socket.on('update', function(data) {
        socket.broadcast.emit('message', data);
    });
    socket.on('disconnect', function(data) {
        console.log('client ', socket.id, ' is diconnecting ');

    });
});


function getRfidData(callback) {
    var data = false;
    var sql = "SELECT * FROM picture_taker.users WHERE rfid='"+currentRfid+"' LIMIT 1";
    var qry = connection.query(sql, function(err, rows) {

        if (err)
        {
            console.log(err);
        }
        if (rows.length > 0) {
            data = rows[0];
        }

        if (callback) {
            callback(data);
        }
    });
}



function unlinkSocial(rfidin, type) {
    var sql = 'UPDATE picture_taker.users SET ' + type + '_data=NULL,' + type + '_time=NULL WHERE ?';
    var qry = connection.query(sql, {rfid: rfidin});
}

//function disablePending() {
//    var sql = 'UPDATE picture_taker.users SET pending=0';
//    connection.query(sql);
//}




//console.log('starting rfid reader');
//exec('/home/pi/scripts/startRC522 2>&1 >> /tmp/rfid_RC522.log', function(e) {
//    console.log(e);
//});



function postRegistrationData(rfid, data){

    var dataString = JSON.stringify(data);

    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': dataString.length
    };

    var options = {
        host: 'socialposter.appledecay.com',
        port: 80,
        path: '/register/'+rfid+'/'+Date.now()+'/signature',
        method: 'POST',
        headers: headers
    };

    console.log('going to make requst with ', options, dataString);

// Setup the request.  The options parameter is
// the object we defined above.
    var req = http.request(options, function(res) {
        res.setEncoding('utf-8');

        var responseString = '';

        res.on('data', function(data) {
            responseString += data;
        });

        res.on('end', function() {
            try {
                var resultObject = JSON.parse(responseString);
                console.log('the response was', resultObject);
            }catch(e) {
                console.log('the response was not JSON', e,responseString);
            }
        });
    });

    req.on('error', function(e) {
        // TODO: handle error.
        console.log('there was an error',e);
    });

    req.write(dataString);
    req.end();

}