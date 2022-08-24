const path = require('path');
const http = require('http');
const express = require("express");
<<<<<<< Updated upstream
=======
const socketio = require('socket.io')
const formatMessage = require('./public/js/utils/messages');
const mongoclient = require('mongodb');
const mongoose = require("mongoose");
const multer = require("multer");
>>>>>>> Stashed changes
const bcrypt = require("bcryptjs");
const config = require("config");
const session = require('express-session')
const MongoDBStore = require("connect-mongodb-session")(session);
const app = express();
const server = http.createServer(app);
const connectDB = require("./config/db");
const mongoURI = config.get("mongoURI");
const User = require("./models/User");
const isAuth = require("./middleware/is-auth");
const isAdmin = require("./middleware/is-admin");
<<<<<<< Updated upstream
=======
const isGuest = require('./middleware/is-guest');
const { disconnect } = require('process');
>>>>>>> Stashed changes
const PORT = 8081;
const io = socketio(server)


connectDB();

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const store = new MongoDBStore({
    uri: mongoURI,
    collection: "mySessions",
});

app.use(
    session({
      secret: "secret",
      resave: false,
      saveUninitialized: false,
      store: store,
    })
  );
//routes
<<<<<<< Updated upstream

app.get("/", function(req,res){
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/signup",function(req,res){
=======
//---------------------------------------//

//For Chat//
const MyName = 'Gelato de Creme';

let userName = 'USER';

//guest's routes
//---------------------------------------//
app.get("/", isGuest, function(req,res){
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/chat", isGuest, function(req,res){
    res.sendFile(__dirname + "/public/chat.html");
});

app.get("/chatInner", isGuest, function(req,res){
    userName = req.query.username;
    res.sendFile(__dirname + "/public/chatInner.html");
    console.log(userName);
});
//----------sign up---------------------//
app.get("/signup",isGuest,function(req,res){
>>>>>>> Stashed changes
    res.sendFile(__dirname + "/public/signup.html");
});

app.post('/signup', async (req,res) =>{
    const fullname = req.body.fullname;
    const email = req.body.email;
    const password = req.body.password;

    let user = await User.findOne({ email });
    if (user){
        alert("User already exists...");
        return res.redirect("/signup");    
    }

    const hasdPsw = await bcrypt.hash(password, 12);

    user = new User({
        fullname,
        email,
        password: hasdPsw,
        admin:false,
    });
    await user.save();
    res.redirect("/signin");
}); 

app.get("/loginReminder",function(req,res){
    res.sendFile(__dirname+ "/public/loginReminder.html");
});

app.get("/adminMenu",isAdmin,function(req,res){
    res.sendFile(__dirname + "/public/adminMenu.html");
})

app.get("/adminReminder",function(req,res){
    res.sendFile(__dirname   + "/public/adminReminder.html");
})

app.get("/signin",function(req,res){
    res.sendFile(__dirname + "/public/signIn.html");
});

app.post("/signin",async (req,res)=>{
    const {email,password} = req.body;
    const user = await User.findOne({email});
    const adminStatus = user.admin;
    if (!user){
        console.log("No such user");
        return res.redirect("/signin");
    }
    const isMatch = await bcrypt.compare(password,user.password);
    if (!isMatch){
        console.log("Wrong password...");
        return res.redirect("/signin");
    }
    req.session.isAuth = true;
    req.session.fullname = user.fullname;
    req.session.email = user.email;
    req.session.password = user.password;
    if (adminStatus){
        req.session.isAdmin = true;
        res.redirect("/adminMenu");
    }else{
        res.redirect("/");
    }
});

app.get("/cart",isAuth, (req,res)=>{
    res.sendFile(__dirname + "/public/cart.html");
});
app.get("/cartSessionParams",function (req,res){
    const fullname = req.session.fullname;
    const pass = req.session.password;
    res.json({fullname:fullname});
});

app.post("/logout", (req,res)=>{
    req.session.destroy((err)=>{
        if (err) throw err;
        res.redirect("/");
    });
});

<<<<<<< Updated upstream
app.listen(PORT,console.log(`port is running on port ${PORT}...`));
=======
});
//------------------------flavors ordered----------------------------//
app.get("/flavorsPie",async(req,res)=>{
    let arrayOfIceCream = [];
    let totalOrdersCount = 0;
    let flavorToCount = new Map();
    const arr = await IceCream.find({});
    for (let i=0; i<arr.length; i++){
        if (!flavorToCount.has(arr[i].flavor)){
            flavorToCount.set(arr[i].flavor,arr[i].countOrdered);
        }else{
            var number = flavorToCount.get(arr[i].flavor);
            var newNumber = number + arr[i].countOrdered;
            flavorToCount.set(arr[i].flavor,newNumber);
        }
        totalOrdersCount += arr[i].countOrdered;
    }
    let keys = Array.from(flavorToCount.keys());
    for (let i=0; i< keys.length; i++){
        const number = flavorToCount.get(keys[i]);
        const item = {
            "flavor": keys[i],
            "number": number,
            "totalOrders": totalOrdersCount,
        }
        arrayOfIceCream.push(item);
    }
    res.json(arrayOfIceCream);
})
//---------------------------Reservations Per Date------------------//
app.get("/resPerDate",async(req,res)=>{
    const doc = await Reservation.aggregate([
        {$match: {}},
        {$group: {"date": "22-08-21"}}
    ]);
    console.log(count);
    res.json(count);
})

//---------------------------------Chat--------------------------------//

io.on('connection', socket =>{
    socket.emit('message', formatMessage(MyName,'Welcome'));

    //Broadcast when a user connects
    socket.broadcast.emit('message', formatMessage(MyName,'A user has joined the chat'));

    //Broadcast when a user disconncets
    socket.on('disconnect', ()=>{
        io.emit('message', formatMessage(MyName,'A user has joined the chat'))
    });

    //Listen for chat message
    socket.on('chatMessage', (msg)=>{
        io.emit('message', formatMessage(userName,msg));
    })
});

///////////////////////////////////////////////////////////////////////
server.listen(PORT,console.log(`port is running on port ${PORT}...`));
///////////////////////////////////////////////////////////////////////


>>>>>>> Stashed changes
