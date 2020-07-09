var io = require('socket.io')();
var Comment = require('../models/comment.models');
var Posts = require('../models/posts.models');
var User = require('../models/users.models');
var Notification = require('../models/notification.models');
// const { find } = require('../models/comment.models');
var people={}; 

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('join room cmt', (data) => {
        socket.join(data);
        console.log(io.sockets.adapter.rooms[data]);
    });
    socket.on('leave room cmt' , (data) =>{
        console.log(data);
        socket.leave(data);
        console.log(io.sockets.adapter.rooms[data]);
    });
    socket.on('disconnect', () => {
        console.log('a user disconnect');
        Object.keys(people).forEach(function(key){
            if(people[key]==socket.id)
              delete people[key];
          });
        console.log(people);
    });

    socket.on('chat message', (data) => {
        people[data] = socket.id;
        console.log(socket.id);
        console.log(people[data]);
        console.log(people);
    });
    // post comment
    socket.on('post commentposts', async (data) => {
        console.log(data);
        let newCmt = await new Comment({
            idposts: data.idposts,
            iduser: data.iduser,
            document: data.document,
            file:{
                image:" "
            },
            numberLike:[],
            createdAt: new Date(),
            updatedAt: new Date()
        });
        await newCmt.save( async (err, cmt) => {
            if(err) throw err;
            else {
                    
                    let sendSocket = "";
                    if(data.address === 'web'){
                        sendSocket = 'id commentposts web';
                    }else if(data.address === 'android'){
                        sendSocket = 'id commentposts android';
                    }
                    console.log(sendSocket);
                    socket.emit(sendSocket, {id:cmt._id});
                    await Comment.findOne({_id: cmt._id})
                        .populate('idposts', 'iduser')
                        .populate('iduser', 'username avata')
                        .exec( async (err, userCmt) => { // lấy tên hình ảnh user comment
                            if(err) throw err;
                            else{
                                console.log(userCmt);
                                await Comment.find({idposts: data.idposts}).distinct('iduser', async (err, arrUserCmt) =>{ /// lấy danh sách các user cmt
                                    if(err) throw err;
                                    else{
                                        arrUserCmt.forEach( async (id)=>{
                                            if(id != data.iduser){
                                                await Notification.findOne({iduser: id}, async (err,notify)=>{
                                                    if(err) throw err;
                                                    else{
                                                        await Notification.findByIdAndUpdate(notify._id, {$addToSet:{
                                                            listnotification:[{
                                                                idPosts: data.idposts,
                                                                iduserNotify: data.iduser,
                                                                status: false,
                                                                title: 'comment',
                                                                createdAt: new Date(),
                                                                updatedAt: new Date()
                                                            }]
                                                        }}, async (err, kq)=>{
                                                            if(err) throw err;
                                                            console.log('cập nhật thông báo thành công');
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                        await User.findOne({_id: userCmt.idposts.iduser}, async (err,userPosts) => { // lấy tên user đã đăng bài posts
                                            if(err) throw err;
                                            else{
                                                await socket.broadcast.emit('send notification to client', {
                                                    sendNotify: arrUserCmt,
                                                    userPosts: userPosts.username,
                                                    userCmt: userCmt.iduser,
                                                    action: 'comment'
                                                });
                                                await socket.broadcast.emit('update notify android', {
                                                    arrUserCmt: arrUserCmt,
                                                    action: 'comment'
                                                });
                                                console.log(arrUserCmt);
                                            }
                                        });
                                    }
                                });
                            }
                    });
                }
        });
        
    });
    //
    socket.on('id getcommentposts', async (data) => {
        await Comment.findOne({_id: data.id}).populate('iduser','username avata').exec( async (err, datacmt) => {
            if (err) return handleError(err);
            await Comment.find({idposts: datacmt.idposts}).populate('iduser','username avata').exec(async (err, datacmtAll)=> {
                if (err) return handleError(err);
                await io.to(datacmt.idposts).emit('get commentposts', {
                    datacmt:datacmt,
                    datacmtAll:datacmtAll
                });
              });
            
          });
    });
    // get all cmt
    socket.on('show commentposts', async (data) => {
        
        await Comment.find({idposts: data.idposts}).populate('iduser','username avata').exec(function (err, datacmt) {
            if (err) return handleError(err);
            socket.emit('all commentposts', datacmt);
            
          });
    });
    //Like Post
    socket.on('Like posts to server', async (data) =>{
        console.log(data);
        var checkLike = false;
        if(data.action == 'like'){
            await Posts.findByIdAndUpdate(data.idposts, {$addToSet:{
                numberLike:{
                    iduserLike : data.iduser,
                }
            }}, (err, data) => {
                if(err) {
                    res.json({
                        success: false,
                        msg: "Failed to add author"
                    });
                }else{
                    console.log('like' +data);
                };
            });
            checkLike = true;
        };
        if(data.action == 'dislike'){
            await Posts.findByIdAndUpdate(data.idposts, {$pull:{
                numberLike:{
                    iduserLike : data.iduser,
                }
            }}, (err, data) => {
                if(err) {
                    res.json({
                        success: false,
                        msg: "Failed to add author"
                    });
                }else{
                    console.log( 'dislike' +data);
                };
            });
            checkLike = false;
        }
        await Posts.findOne({_id: data.idposts}).populate('iduser','username avata').populate('numberLike.iduserLike','username avata').exec( async (err, result) => {
            if(err) {
                res.json({
                    success: false,
                    msg: "Failed to add author"
                });
            }else{
                console.log(result);
               await io.emit('Like posts to client', {
                    id : result._id,
                    numberlikeposts: result.numberLike.length,
                    userlike: result.numberLike
                });``
                // update notify
                
                if(checkLike === true){
                    result.numberLike.forEach(async (like) =>{
                        if(String(data.iduser) === String(like.iduserLike._id) && String(data.iduser) != String(result.iduser._id)){
                            await Notification.findOne({iduser: result.iduser._id}, async (err,notify)=>{
                                if(err) throw err;
                                else{
                                    await Notification.findByIdAndUpdate(notify._id, {$addToSet:{
                                        listnotification:[{
                                            idPosts: data.idposts,
                                            iduserNotify: data.iduser,
                                            status: false,
                                            title: 'likeposts',
                                            createdAt: new Date(),
                                            updatedAt: new Date()
                                        }]
                                    }}, async (err, kq)=>{
                                        if(err) throw err;
                                        console.log('cập nhật thông báo thành công');
                                        // send notify
                                        await socket.broadcast.to(people[result.iduser._id]).emit('send notification to client', {
                                            sendNotify: result.iduser._id,
                                            userPosts: result.iduser.username,
                                            userLike: like.iduserLike,
                                            action: 'likeposts'
                                        });
                                        await socket.broadcast.to(people[result.iduser._id]).emit('update notify android', {
                                            action:'likeposts'
                                        });
                                    });
                                    console.log({
                                        sendNotify: result.iduser._id,
                                        userPosts: result.iduser.username,
                                        userLike: like.iduserLike,
                                        action: 'likeposts'
                                    });
                                }
                            });
                        }
                    });
                }
            }
        });
    });
    // get comment from android
    // get all notification
    socket.on("get all notification", async (data)=>{
        await Notification.findOne({ iduser: data.iduser})
        .populate('listnotification.iduserNotify', 'username avata')
        .populate('listnotification.idPosts', 'iduser')
        .exec(async (err, result)=>{
            if(err) throw err;
            await Posts.populate(result, {
                path: 'listnotification.idPosts.iduser',
                select: 'username',
                model: 'User'
            }, async (err, notify)=>{
                if(err) throw err;
                await socket.emit("send all notification", notify);
            });
        });
    });
    // get update notification in android
    socket.on("get update notification", async (data)=>{
        await Notification.findOne({ iduser: data.iduser})
        .populate('listnotification.iduserNotify', 'username avata')
        .populate('listnotification.idPosts', 'iduser')
        .exec(async (err, result)=>{
            if(err) throw err;
            await Posts.populate(result, {
                path: 'listnotification.idPosts.iduser',
                select: 'username',
                model: 'User'
            }, async (err, notify)=>{
                if(err) throw err;
                console.log("Thành công android");
                await socket.emit("send update notification", notify);
            });
        });
    });
    function myFunction(id){
        alert(id);
    }
});

module.exports = io;