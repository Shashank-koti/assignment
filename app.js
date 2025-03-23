const express = require("express");
const app = express();
const mongoose  = require("mongoose");
const path = require("path");
const Coupon = require("./models/coupon");
const { v4: uuidv4 } = require('uuid');
const User = require("./models/user");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const {isAdminAuthenticated,isLoggedin} = require('./middleware');
const Admin = require("./models/admin");
const methodOverride = require('method-override');

const sessionOptions = {
  secret: "MYSECRET",
  resave: false,
  saveUninitialized: true,
}

app.use(session(sessionOptions));
app.use(methodOverride('_method'));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(Admin.authenticate()));
passport.serializeUser(Admin.serializeUser());
passport.deserializeUser(Admin.deserializeUser());

app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log("User IP:", ip);
  next();
});
app.set('trust proxy', true);  // Important for Render or Heroku


mongoose.connect("mongodb+srv://shashankkoti05:assignment@assignmentcluster.o82ca.mongodb.net/?retryWrites=true&w=majority&appName=assignmentCluster").then(()=>{
    console.log("mongodb connected");
}).catch((err)=>{
  console.log(err);
})

app.set('view engine', 'ejs');
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
// app.use(methodOverride("_method"));


app.get("/claim",(req,res)=>{
    res.render("home.ejs",{ message: null, success: false });
})

app.post("/claim",async(req,res)=>{
    const ip = req.ip;
    const cookieId = req.cookies?.cid || uuidv4();
    const username = req.body.username;

    if (!req.cookies?.cid) {
        res.cookie('cid',
          cookieId, 
          { maxAge: 30 * 24 * 60 * 60 * 1000 }); // 30 days
      }

    
      // 1. Check if this IP or cookie already claimed
      const existingUser = await User.find({
        $or: [
          { 'claimedBy.ip': ip },
          { 'claimedBy.cookieId': cookieId }
        ],
        isClaimed: true,
      });


      if (existingUser.length>0) {
        return res.render('claimCoupon', {
          message: "⚠️ You have already claimed a coupon.",
          success: false,
          couponCode:existingUser[0].code,
          username:username
        });
      }
    
      // 2. Assign coupon
      const coupon = await Coupon.findOneAndUpdate(
        { used: false },
        { used: true, assignedTo: username },
        { new: true }
      );

      if (!coupon) {
        return res.render('claimCoupon', {
          message: "❌ No coupons left.",
          success: false
        });
      }
    
      // 3. Create user record to log the claim
      const userData = new User({
        isClaimed: true,
        claimedBy: {
          ip,
          cookieId,
          timestamp: new Date()
        },
        isActive: true,
        code: coupon.code
      });
    
      await userData.save();
    
      // 4. Show the coupon
      res.render('claimCoupon', {
        username,
        couponCode: coupon.code
      });
      
});

// Show login page
app.get("/admin/login", (req, res) => {
  res.render("admin/login.ejs");
});

// Handle login form submission
app.post('/admin/login', passport.authenticate('local', {failureRedirect: '/admin/login'}), (req, res) => {
  res.redirect('/admin/dashboard');
});


app.get('/admin/dashboard',isLoggedin, isAdminAuthenticated, async (req, res) => {
  const coupons = await Coupon.find({});
  const claims = await User.find({ isClaimed: true });
  res.render('admin/adminDashboard.ejs', { coupons, claims });
});

app.post("/admin/coupons",async(req,res)=>{
  const { code, description } = req.body;
  const newCoupon = new Coupon({ code, description });
  await newCoupon.save();
  res.redirect("/admin/dashboard");
})

app.get('/admin/coupons/:id/edit',isLoggedin, isAdminAuthenticated, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.send("Coupon not found");
    }
    res.render('editCoupon.ejs', { coupon });
  } catch (err) {
    console.error(err);
    res.send("Error loading edit page");
  }
});

app.put("/admin/coupons/:id/edit", isAdminAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { code, description, used } = req.body;

    await Coupon.findByIdAndUpdate(id, {
      code,
      description,
      used: used === "on" // checkbox handling
    });

    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("Error updating coupon:", err);
    res.status(500).send("Failed to update coupon");
  }
});


app.delete("/admin/coupons/:id",isLoggedin, isAdminAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    await Coupon.findByIdAndDelete(id);
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("Error deleting coupon:", err);
    res.status(500).send("Internal Server Error");
  }
});


app.listen(8080, (req,res)=>{
    console.log("Server is running on port 8080");
});