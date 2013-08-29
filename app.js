/**
 * Main application script
 *
 * User: Etienne
 * Date: 29/08/13
 * Time: 12:39
 */

////////////////////
// INITIALIZATION //
////////////////////

var server = require('http').createServer();
var io = require('socket.io').listen(server);

// SOCKET IO CONFIGURATION
require('./config/io.js')(io);


//////////////////////
// SOCKET IO EVENTS //
//////////////////////

io.of('/project').on('connection', function (socket) {

    console.log(socket.id, 'connected from', socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address);

    // send ack and broadcast on client joining project
    socket.on('join', function(data){
        var project = data.project;
        var user = data.user;
        socket.join(project._id);
        socket.emit('join-ack', data);
        // broadcast new joiner ID
        socket.broadcast.to(project._id).emit('join', data);
        socket.set('project', project, function(){
            socket.set('user', user);
        });
    });

    // broadcast tree update to project peers
    socket.on('tree-update', function (data) {
        socket.get('project', function(err, project) {
            socket.broadcast.to(project._id).emit('tree-update', data);
        });
    });

    // broadcast disconnection to project peers
    socket.on('disconnect', function(){
        socket.get('project', function(err, project) {
            socket.get('user', function(err, user) {
                socket.broadcast.to(project._id).emit('left', {project: project, user: user});
                socket.leave(project);
            });
        });
    });
});


//////////////////
// START SERVER //
//////////////////

server.listen(process.env.PORT || 80, function(){
    console.log("Server listening on port " + (process.env.PORT || 80));
});
