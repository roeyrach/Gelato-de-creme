const express = require("express");
const bcrypt = require("bcryptjs");
const config = require("config");
const session = require('express-session')
const MongoDBStore = require("connect-mongodb-session")(session);
const app = express();
const connectDB = require("./config/db");
const mongoURI = config.get("mongoURI");
const User = require("./models/User");
const isAuth = require("./middleware/is-auth");
const isAdmin = require("./middleware/is-admin");
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

app.get("/", function(req,res){
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/signup",function(req,res){
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

app.listen(PORT,console.log(`port is running on port ${PORT}...`));