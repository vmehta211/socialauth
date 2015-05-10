function putSocialInfoIn(){
      if(typeof pageData != 'undefined'){
        
        if(pageData.facebook_data != null){
            var fbdata = $.parseJSON(pageData.facebook_data);
            var fb_name = fbdata.profile.displayName;
            var fb_pic = fbdata.profile.photos[0].value;
            var html = '<div id="facebook_data"><img src="'+fb_pic+'"/><span> '+fb_name+'</span><a href="#" onClick="unlinkSocial(\'facebook\')"> | unlink</a></div>';
            $('#linktofb').replaceWith(html)
        }
        
         if(pageData.twitter_data != null){
            var twdata = $.parseJSON(pageData.twitter_data);
            var tw_name = twdata.profile.displayName;
            var tw_pic = twdata.profile.photos[0].value;
            var html = '<div id="twitter_data"><img src="'+tw_pic+'"/><span> '+tw_name+'</span><a href="#" onClick="unlinkSocial(\'twitter\')"> | unlink</a></div>';
            $('#linktotwit').replaceWith(html)
            
        }
        
    }
}

function unlinkSocial(type){
    var data = {
        type:type,
        rfid:pageData.rfid        
    }
     iosocket.emit('unlinkSocial', data);
     
     if(data.type == 'facebook'){
         $('#facebook_data').replaceWith('<a id="linktofb" href="/auth/facebook"><img src="images/facebook.png" class="logo"></a>');
     }
     else if(data.type == 'twitter'){
         $('#twitter_data').replaceWith('<a id="linktotwit" href="/auth/twitter"><img src="images/twitter.png" class="logo"></a>');
     }
     
}

$(function() {
    console.log("ready!");
    //check if we any socials are already registered
    putSocialInfoIn();
    
    iosocket = io.connect();
    iosocket.once('connect', function() {
        $('#incomingChatMessages').append($('<li>Connected..</li>'));
        iosocket.on('write', function(msg) {
            console.log('reading from browser: ', msg);
            
        });
        iosocket.on('nfcevent',function(data){
            message = data.msg.trim();
            
            //message = message.trim();
            $('.rfid_message').text(message);
            console.log('nfcevent', message);
            
            if(data.alreadyLinked){
                console.log('this rfid has already been linked with the following', data.links)
                pageData = data.links;
                putSocialInfoIn();
            }
            
            if(data.showSocial){
                $('#link_to_social').show();
                
            }
            
            //$('#incomingChatMessages').append($('<li></li>').text(message));
        });
        iosocket.on('message', function(message) {
            $('#incomingChatMessages').append($('<li></li>').text(message));

            message = message.trim();

            if (message.indexOf('state:upload_start') === 0) {
                $('#incomingChatMessages').append($('<li></li>').text("dude the upload has started"));
            } else if (message.indexOf('state:upload_complete') === 0) {
                $('.postingtofb').remove();
                $('.addtofacebook').remove();

                var imageUrl = message.substring(22);
                $('#incomingChatMessages').append($('<li></li>').text("the image url is " + imageUrl));

                //$('#imageLocation').html('<img src="' + 'http://11.0.0.1:81/eyefi/pix/' + imageName + '" style="width:1000px"/>');

                var addActive = '';

                if ($('.active').length == 0) {
                    console.log('gonna add active');
                    addActive = ' active';
                }

                var photoName = imageUrl.split('/');
                photoName = photoName[photoName.length - 1];

                var imgs = '<img src="' + imageUrl + '" style="width:1000px"/>';
                imgs += '<img src="' + overlaySource + '" style="width:128px" />'

                var html = '<div data-filename="' + photoName + '" class="cameraroll' + addActive + '">' + imgs;
                html += '<img class="addtofacebook" src="images/facebook-button-sm.png"/>';
                html += '<img class="addtotwitter" src="images/twitter.jpg"/>';
                html += '</div>';
                $('#cycler').append(html)

                if (addActive == '') {
                    cycleImages();
                }
            }

        });
        iosocket.on('disconnect', function() {
            $('#incomingChatMessages').append('<li>Disconnected</li>');
        });

//                    iosocket.on('pourrequest', function(data) {
//                        console.log('received pour request from nodejs server', data);
//                        pourRequest(data);
//                    })
//                    iosocket.on('pourstarted', function(data) {
//                        pourStarted(data);
//                    })
//                    iosocket.on('pourcomplete', function(data) {
//                        pourComplete(data);
//                    })


    });

    iosocket.on('reconnect', function() {
        $('#incomingChatMessages').append('<li>Reconnected</li>');
    });

    $('#outgoingChatMessage').keypress(function(event) {
        if (event.which == 13) {
            event.preventDefault();
            //$(iosocket).trigger('write',($('#outgoingChatMessage').val()));
            iosocket.emit('write', $('#outgoingChatMessage').val());
            $('#incomingChatMessages').append($('<li></li>').text(">> " + $('#outgoingChatMessage').val()));
            $('#outgoingChatMessage').val('');
        }
    });

});

