const express = require("express");
const path = require('path');
const http = require('http');
const socketio = require('socket.io')
const formatMessage = require('./public/js/utils/messages');
const mongoclient = require('mongodb');
const mongoose = require("mongoose");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const config = require("config");
const session = require('express-session')
const MongoDBStore = require("connect-mongodb-session")(session);
const app = express();
const connectDB = require("./config/db");
const mongoURI = config.get("mongoURI");
const User = require("./models/User");
const IceCream = require("./models/IceCream");
const Reservation = require("./models/Reservation");
const isAuth = require("./middleware/is-auth");
const isAdmin = require("./middleware/is-admin");
const isGuest = require('./middleware/is-guest');
const Gelateria = require('./models/Gelateria');
const disconnect  = require('process');
const PORT = 8081;
const server = http.createServer(app);
const io = socketio(server)

//connect to database
connectDB();

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//store the session in "mySessions" table 
//----------------------------------------//
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
//------------------------For Chat--------------------//
const MyName = 'Gelato de Creme';
let userName = 'USER';
app.get("/chat", isGuest, function(req,res){
    res.sendFile(__dirname + "/public/chat.html");
});

app.get("/chatInner", isGuest, function(req,res){
    userName = req.query.username;
    res.sendFile(__dirname + "/public/chatInner.html");
    // console.log(userName);
});
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
//---------------------------------------//
//guest's routes
//---------------------------------------//
app.get("/", isGuest, function(req,res){
    res.sendFile(__dirname + "/public/index.html");
});
//----------sign up---------------------//
app.get("/signup",isGuest,function(req,res){
    res.sendFile(__dirname + "/public/signup.html");
});
app.post('/signup', async (req,res) =>{
    const fullname = req.body.fullname;
    const email = req.body.email;
    const password = req.body.password;

    let user = await User.findOne({ email });
    if (user){
        return res.redirect("/signup");    
    }

    const hasdPsw = await bcrypt.hash(password, 12);
    if (fullname.includes(" ") && email.includes("@") && email.includes(".") && password.length >= 6){
        user = new User({
            fullname,
            email,
            password: hasdPsw,
            admin:false,
        });
        await user.save();
        res.redirect("/signin");
    }else{
		//res.redirect("/signup");
    }
}); 
//----------sign in---------------------//
app.get("/signin",isGuest,function(req,res){
    res.sendFile(__dirname + "/public/signIn.html");
});
app.post("/signin",async (req,res)=>{
    const {email,password} = req.body;
    const user = await User.findOne({email});
    if (!user){
        console.log("No such user");
        return res.redirect("/signin");
    }
    const isMatch = await bcrypt.compare(password,user.password);
    if (!isMatch){
        console.log("Wrong password...");
        return res.redirect("/signin");
    }
    req.session.selected = "nothing yet";
    req.session.isAuth = true;
    req.session.fullname = user.fullname;
    req.session.email = user.email;
    req.session.password = user.password;
    if (user.admin){
        req.session.isAdmin = true;
        res.redirect("/adminMenu");
    }else{
        res.redirect("/userMenu");
    }
});
//user's routes
//-------------------reservation--------------------------//
app.get("/userMenu",isAuth,(req,res)=>{
    res.sendFile(__dirname + "/public/userMenu.html");
});
//-----------search ice cream----------------//
app.get("/reservationSelect",isAuth,function(req,res){
    res.sendFile(__dirname + "/public/reservationSelect.html");
});
//----------search results and start order---//
app.post("/resSelect",async(req,res)=>{
    const name = req.body.inname;
    req.session.reload(function(err){
        if (err) throw err;
        else{
            if (req.session.selected === "nothing yet"){
                req.session.selected = name;
            }else{
                const str = req.session.selected + "," + name;
                req.session.selected = str;
            }
            req.session.save();
        }
    });
    res.redirect("/cart");
});
//---------------------selection result in user's cart------------------//
app.get("/cart",isAuth, (req,res)=>{
    res.sendFile(__dirname + "/public/cart.html");
});
//--------cancel current order and back to search options---//
app.get("/cancelOrder",isAuth,(req,res)=>{
    req.session.reload(function(err){
        if (err) throw err;
        else{
            req.session.selected = "nothing yet";
        }
            req.session.save();
    });
    res.redirect("/userMenu");
});
//---finish the order, add reservation and update ice cream and user----//
app.post("/finishOrder",async(req,res)=>{
    let count =0;
    let sum = 0;
    const selectedArr = req.session.selected.split(",");
    for (let i =0; i<selectedArr.length; i++){
        const str = selectedArr[i].split("_");
        const name = str[0];
        const quantity = str[1];
        const filter = {"name": name};
        const iceCream = await IceCream.findOne(filter);
        if (iceCream != null){
            const newQuantity = iceCream.quantity - quantity;
            if (newQuantity > 0){
                await IceCream.findOneAndUpdate(filter,{$set:{"quantity":newQuantity}},{new:true},(err,doc)=>{
                    req.session.reload(function(err){
                        if (err) throw err;
                        else{
                            req.session.selected = "nothing yet";
                            req.session.save();
                        }
                    });
                });
                count++;
            }
        }else{
            break;
        }
    }
    if (count === selectedArr.length){
        const orderNumber = Math.random();
        const email = req.session.email;
        const date = new Date().toISOString().slice(0, 10);
        const price = 0;
        const content = req.session.selected;
        const arr = content.split(",");
        let reservation = await Reservation.findOne({ orderNumber });
        if (reservation){
            return res.redirect("/userMenu");    
        }
        reservation = new Reservation({
            orderNumber,
            email,
            date,
            price,
            content
        });
        for (let i =0; i<arr.length; i++){
            const name = arr[i].split("_"); 
            const ice = await IceCream.findOne({"name":name});
            const count = ice.countOrdered;
            await IceCream.findOneAndUpdate({"name":name},{$set:{"countOrdered": count+1 }},{new:true},(err,doc)=>{
            });
            await User.findOne({"email":req.session.email},function(err,doc){
                if (doc.listOfOrders.get(name[0]) != undefined){
                    const str = doc.listOfOrders.get(name[0]);
                    const num = parseInt(str);
                    const newNum = num+1;
                    doc.listOfOrders.set(name[0],newNum);
                    doc.save(function(err){
                        if (err) throw err;
                    });
                }else{
                    doc.listOfOrders.set(name[0],1);
                    doc.save(function(err){
                        if (err) throw err;
                    })
                }
            })
        }
        await reservation.save();
        res.redirect("/userMenu");
    }else{
        req.session.reload(function(err){
            if (err) throw err;
            else{
                req.session.selected = "nothing yet";
                req.session.save();
            }
        });
        res.redirect("/wrongQuantity");
    }

});
//-----------------------users profile-----------------------------------//
app.get("/profile",isAuth,(req,res)=>{
    res.sendFile(__dirname + "/public/profile.html");
})
//--------------------Most Recommended Ice Cream For User from mongodb------//
app.get("/recommendedIceCream",async(req,res)=>{
    let max = 0;
    let recName = "";
    const user = await User.findOne({"email":req.session.email});
    const arr = user.listOfOrders;
    let keys = Array.from(arr.keys());
    if (keys.length != 0){
        for (let i =0; i < keys.length; i++){
            const iceCreamName = keys[i];
            const str = user.listOfOrders.get(iceCreamName);
            const num = parseInt(str);
            if (num > max){
                max = num;
                recName = iceCreamName;
            }
        }
        const icecream = await IceCream.findOne({"name":recName});
        res.json({
            "recName" : recName,
            "flavor" : icecream.flavor,
        })
    }else{
        res.json({"text":"We Don't Know Anything yet"});
    }
})
//--------------------selected ice cream json--------------------------------//
app.get("/selectedIceCreams",(req,res)=>{
    let arr = req.session.selected.split(",");
    res.send(arr);
})
///////////////////////////////////////////////////////////////////////////////////////
//admin's routes
//------------------------users list-------------------------------//
app.get("/adminMenu",isAdmin,function(req,res){
    res.sendFile(__dirname + "/public/adminMenu.html");
})
//------------------------ice cream admin's options----------------//
app.get("/adminMenu/iceCreams",isAdmin,function(req,res){
    res.sendFile(__dirname + "/public/adminIceCreamsMenu.html");
});
//---------------------add ice cream-------------------------------//
app.post('/addIceCream', async (req,res) =>{
    const name = req.body.name;
    const flavor = req.body.flavor;
    const quantity = req.body.quantity;
    const price = req.body.price;
    const photoURL = req.body.photoURL;
    const countOrdered = 0;

    let iceCream = await IceCream.findOne({ name });
    if (iceCream){
        alert("Ice Cream already exists...");
        return res.redirect("/addIceCream");    
    }

    iceCream = new IceCream({
        name,
        flavor,
        quantity,
        price,
        photoURL,
        countOrdered,
    });
    await iceCream.save();
    res.redirect("/adminMenu/iceCreams");
});
//--------------------------search ice cream results--------------//
app.get("/searchResults",function(req,res){
    res.sendFile(__dirname + "/public/searchResults.html");
});
//---------------------------update ice cream---------------------//
app.post("/updateIceCream",async(req,res)=>{
    const option = req.body.updOption.toLowerCase();
    const optionToString = option.toString();
    const filter = {"name": req.body.iceCreamName};
    let quantity = "";
    let price = "";
    let photoURL = "";
    let update = null;
    if (option === "quantity"){
        quantity = option;
        update = {$set:{quantity: req.body.values}};
    }
    if (option === "price"){
        price = option;
        update = {$set:{price: req.body.values}};
    }
    if (option === "url"){
        photoURL = option;
        update = {$set:{photoURL: req.body.values}};
    }
    await IceCream.findOneAndUpdate(filter, update, {new: true}, (err, doc) => {
        if (err) {
            console.log("Something wrong when updating data!");
        }
        res.redirect("/adminMenu/iceCreams");
    });
});
//---------------------------delete ice cream---------------------//
app.post("/deleteIceCream",async(req,res)=>{
    await IceCream.findOneAndDelete({"name": req.body.iceCreamName});
    res.redirect("/adminMenu/iceCreams")
})
//-----------------------------stats admin's menu----------------//
app.get("/adminMenu/Stats",function(req,res){
    res.sendFile(__dirname + "/public/statsAdmin.html");
});
//--------------------------Gelateria admin's Menu----------------//
app.get("/adminMenu/gelaterias",isAdmin,(req,res)=>{
    res.sendFile(__dirname + "/public/admiGelateriasMenu.html");
})
//--------------------------add gelateria--------------------------//
app.post("/addGelateria",async(req,res)=>{
    const address = req.body.address;
    const latitude = req.body.lat;
    const longitude = req.body.lng;
    const photoURL = req.body.photoURL;
    
    let gelateria = await Gelateria.findOne({address});
    if (gelateria){
        res.redirect("/adminMenu/gelaterias");
    }else{
        gelateria = new Gelateria({
            address,
            latitude,
            longitude,
            photoURL
        });
        await gelateria.save();
        res.redirect("/adminMenu/gelaterias");
    }
})
//-----------------------------update photo url gelateria--------------//
app.post("/updateGelateria",async(req,res)=>{
    const address = req.body.address;
    const url = req.body.url;
    await Gelateria.findOneAndUpdate({"address":address},{$set:{"photoURL": url}},{new:true},(err,doc)=>{
        res.redirect("/adminMenu/gelaterias");
    });
})
//--------------------------delete gelateria by address---------------------//
app.post("/deleteGelateria",async(req,res)=>{
    const address = req.body.address;
    await Gelateria.findOneAndDelete({"address": address});
});
//---------------------------all gelaterias from mongodb-------------------------//
app.get("/showGelaterias",async(req,res)=>{
    const doc = await Gelateria.find({});
    res.json(doc);
})
//------------------------all users from mongodb---------------------------------//
app.get("/showData",async(req,res)=>{
    const all = await User.find({});
    res.json(all);
})
//-----------------------all ice creams from mongodb-------------//
app.get("/adminMenu/showIceCreamsList",async(req,res)=>{
    const all = await IceCream.find({});
    res.json(all);
})
//-----------------------all ice creams sorted by countOrdered------------//
app.get("/adminMenu/showMostWantedIceCream",async(req,res)=>{
    const all = await IceCream.find({}).sort({countOrdered:-1});
    res.json(all);
});
//-----------------------all ice creams sorted by price------------//
app.get("/adminMenu/showMaxPriceIceCream",async(req,res)=>{
    const all = await IceCream.find({}).sort({price:-1});
    res.json(all);
});
app.get("/adminMenu/showMinPriceIceCream",async(req,res)=>{
    const all = await IceCream.find({}).sort({price:1});
    res.json(all);
});
//------------------------------all reservations--------------------//
app.get("/adminMenu/showReservations",async(req,res)=>{
    const all = await Reservation.find({});
    res.json(all);
})
//-----------------------------log-out------------------------------//
app.get("/logout", (req,res)=>{
    req.session.destroy((err)=>{
        if (err) throw err;
        res.redirect("/");
    });
});
//----------------------------------Blocked Pages------------------//
app.get("/loginReminder",function(req,res){
    res.sendFile(__dirname+ "/public/loginReminder.html");
});
app.get("/guestReminder",isAuth,function(req,res){
    res.sendFile(__dirname+ "/public/guestReminder.html");
});
app.get("/adminReminder",function(req,res){
    res.sendFile(__dirname   + "/public/adminReminder.html");
});
app.get("/wrongQuantity",function(req,res){
    res.sendFile(__dirname + "/public/wrongQuantity.html");
});
//-----------------------------profile json--------------------------//
app.get("/profileInfo",async(req,res)=>{
    const name = req.session.fullname;
    const email = req.session.email;
    const listOfOrders = await Reservation.find({"email":email});
    res.json({
                "name":name,
                "email":email,
                "listOfOrders":listOfOrders
            })
});
//------------------------------change password----------------------//
app.get("/changePassword",isAuth,(req,res)=>{
    res.sendFile(__dirname + "/public/changePassword.html");
})
app.post("/changePassword",async(req,res)=>{
    const password = req.body.pass;
    const rePassword = req.body.repass;
    const hasdPsw = await bcrypt.hash(password, 12);
    if (password === rePassword && password.length >= 6){
        await User.findOneAndUpdate({"email":req.session.email},{$set:{"password":hasdPsw}},{new:true},(err,doc)=>{
            res.redirect("/userMenu");
        });
    }else{
        res.redirect("/changePassword");
    }

});
//------------------------flavors ordered----------------------------//
app.get("/flavorsPie1",async(req,res)=>{
    let toSend = [];
    const total = await IceCream.aggregate([
        {$group:{_id: "all" , count:{$sum:"$countOrdered"}}}
    ])
    toSend.push(total)
    const doc = await IceCream.aggregate([
        {$group:{_id:"$flavor", count:{$sum: "$countOrdered" }}}
    ])
    toSend.push(doc);
    res.json(toSend);
})
//---------------------------Reservations Per Date------------------//
app.get("/resPerDate",async(req,res)=>{
    const doc = await Reservation.aggregate([
        {$group:{_id: "$date",count: {$sum:1}}},
    ]);
    res.json(doc);
})
//----------------------------Google Maps-----------------------------//
app.get("/googleMaps",(req,res)=>{
    res.sendFile(__dirname + "/public/googleMaps.html");
})
app.get("/googleMapsUser",(req,res)=>{
    res.sendFile(__dirname + "/public/googleMapsUser.html");
})
//---------------------------all gelaterias--------------------------//
app.get("/showGel",async(req,res)=>{
    const doc = await Gelateria.find({});
    res.json(doc);
})
///////////////////////////////////////////////////////////////////////
server.listen(PORT,console.log(`port is running on port ${PORT}...`));
///////////////////////////////////////////////////////////////////////
//API_KEY = AIzaSyBQjZcimwSklHcdldamDTXj3eqk9f_4a34