$(function() {
    console.log("ready!");

    iosocket = io.connect();
    iosocket.once('connect', function() {
        $('#incomingChatMessages').append($('<li>Connected..</li>'));
        iosocket.on('write', function(msg) {
            console.log('reading from browser: ', msg);
            
        });
        iosocket.on('nfcevent',function(data){

            console.log(data);
            window.location.href = 'http://jason.appledecay.com/web_socialauth/?referFrom=' + encodeURIComponent(window.location.href) + '&rfid=' + encodeURIComponent(data.rfid);
            
            //$('#incomingChatMessages').append($('<li></li>').text(message));
        });
    });

});

