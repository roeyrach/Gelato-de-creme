const express = require("express");
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
    req.session.selected = "nothing yet";
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

app.get("/cart",isAuth, (req,res)=>{
    res.sendFile(__dirname + "/public/cart.html");
});

app.get("/logout", (req,res)=>{
    req.session.destroy((err)=>{
        if (err) throw err;
        res.redirect("/");
    });
});
app.get("/selectedIceCreams",(req,res)=>{
    let arr = req.session.selected.split(",");
    res.send(arr);
})
app.get("/adminMenu/iceCreams",isAdmin,function(req,res){
    res.sendFile(__dirname + "/public/adminIceCreamsMenu.html");
});
app.get("/searchResults",function(req,res){
    res.sendFile(__dirname + "/public/searchResults.html");
})
app.get("/reservationSelect",isAuth,function(req,res){
    res.sendFile(__dirname + "/public/userMenu.html");
});

app.get("/cancelOrder",(req,res)=>{
    req.session.reload(function(err){
        if (err) throw err;
        else{
            req.session.selected = "nothing yet";
        }
            req.session.save();
    });
    res.redirect("/reservationSelect");
});

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
            console.log(newQuantity);
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
        let reservation = await Reservation.findOne({ orderNumber });
        if (reservation){
            alert("Reservation already exists...");
            return res.redirect("/reservationSelect");    
        }
        reservation = new Reservation({
            orderNumber,
            email,
            date,
            price,
            content
        });
        await reservation.save();
        res.redirect("/reservationSelect");
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
app.get("/wrongQuantity",function(req,res){
    res.sendFile(__dirname + "/public/wrongQuantity.html");
});

app.get("/adminMenu/Stats",function(req,res){
    res.sendFile(__dirname + "/public/statsAdmin.html");
});
app.listen(PORT,console.log(`port is running on port ${PORT}...`));
