const express = require("express");
const mongoclient = require('mongodb');
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const config = require("config");
const session = require('express-session')
const MongoDBStore = require("connect-mongodb-session")(session);
const app = express();
const connectDB = require("./config/db");
const mongoURI = config.get("mongoURI");
const User = require("./models/User");
const IceCream = require("./models/IceCream");
const isAuth = require("./middleware/is-auth");
const isAdmin = require("./middleware/is-admin");
const isGuest = require('./middleware/is-guest');
const PORT = 8081;

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

app.get("/", isGuest, function(req,res){
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/signup",isGuest,function(req,res){
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

app.post('/addIceCream', async (req,res) =>{
    const name = req.body.name;
    const flavor = req.body.flavor;
    const quantity = req.body.quantity;
    const price = req.body.price;

    let iceCream = await IceCream.findOne({ name });
    if (iceCream){
        alert("Ice Cream already exists...");
        return res.redirect("/addIceCream");    
    }

    iceCream = new IceCream({
        name,
        flavor,
        quantity,
        price
    });
    await iceCream.save();
    res.redirect("/adminMenu/iceCreams");
}); 
app.get("/adminMenu/showIceCreamsList",async(req,res)=>{
    const all = await IceCream.find({});
    res.json(all);
})

app.post("/deleteIceCream",async(req,res)=>{
    await IceCream.findOneAndDelete({"name": req.body.iceCreamName});
    res.redirect("/adminMenu/iceCreams")
})

app.post("/updateIceCream",async(req,res)=>{
    const option = req.body.updOption.toLowerCase();
    const optionToString = option.toString();
    const filter = {"name": req.body.iceCreamName};
    let quantity = "";
    let price = "";
    let update = null;
    if (option === "quantity"){
        quantity = option;
        update = {$set:{quantity: req.body.values}};
    }
    if (option === "price"){
        price = option;
        update = {$set:{price: req.body.values}};
    }
    await IceCream.findOneAndUpdate(filter, update, {new: true}, (err, doc) => {
        if (err) {
            console.log("Something wrong when updating data!");
        }
        console.log(doc);
        res.redirect("/adminMenu/iceCreams");
    });
});


app.get("/loginReminder",function(req,res){
    res.sendFile(__dirname+ "/public/loginReminder.html");
});

app.get("/guestReminder",isAuth,function(req,res){
    res.sendFile(__dirname+ "/public/guestReminder.html");
});

app.get("/adminMenu",isAdmin,function(req,res){
    res.sendFile(__dirname + "/public/adminMenu.html");
})

app.get("/adminReminder",function(req,res){
    res.sendFile(__dirname   + "/public/adminReminder.html");
})

app.get("/signin",isGuest,function(req,res){
    res.sendFile(__dirname + "/public/signIn.html");
});
app.get("/showData",async(req,res)=>{
    const all = await User.find({});
    res.json(all);
})
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
    req.session.isAuth = true;
    req.session.fullname = user.fullname;
    req.session.email = user.email;
    req.session.password = user.password;
    if (user.admin){
        req.session.isAdmin = true;
        res.redirect("/adminMenu");
    }else{
        res.redirect("/reservationSelect");
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

app.get("/adminMenu/iceCreams",isAdmin,function(req,res){
    res.sendFile(__dirname + "/public/adminIceCreamsMenu.html");
});
app.get("/searchResults",function(req,res){
    res.sendFile(__dirname + "/public/searchResults.html");
})
app.get("/reservationSelect",isAuth,function(req,res){
    res.sendFile(__dirname + "/public/userMenu.html");
});
app.listen(PORT,console.log(`port is running on port ${PORT}...`));
