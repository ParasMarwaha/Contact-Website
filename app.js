const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const {verify} = require('jsonwebtoken');
const connection = require('./connection');
const admincontroller = require('./controllers/admincontroller');
const cookieParser = require('cookie-parser');
const fileupload = require('express-fileupload');
app.set('view engine', 'ejs');
const Razorpay = require('razorpay');

app.use(express.json())
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }))
app.use(fileupload({}))
app.use(express.static('public'));

function AdminAuthorization(req,res,next){
    if (req.cookies.adminToken == undefined) {
        return res.redirect('/admin-login')
    }

    let token = req.cookies.adminToken
    let secret = "abc@123"

    try {
        req['adminInfo'] = verify(token, secret)
        // console.log(req['customerInfo'])
        next()
    } catch (error) {
        res.redirect('/admin-login')
    }
}

function customerAuthorization(req,res,next){
    if (req.cookies.customerToken == undefined) {
        return res.redirect('/user-login-page')
    }

    let token = req.cookies.customerToken
    let secret = "abc@123"

    try {
        req['customerInfo'] = verify(token, secret)
        // console.log(req['customerInfo'])
        next()
    } catch (error) {
        res.redirect('/user-login-page')
    }
}

function customerAuthorization_http_request(req,res,next){
    if (!req.cookies.customerToken) {
        return res.json({error:'Unauthorized Access',message:''})

    }

    let token = req.cookies.customerToken
    let secret = "abc@123"

    try {
        req['customerInfo'] = verify(token, secret)
        next()
    } catch (error) {
        res.json({error:error.message ,message:''})
    }
}

function AdminAuthorization_http_request(req,res,next){
    if (!req.cookies.adminToken) {
        return res.json({error:'Unauthorized Access',message:''})
    }

    let token = req.cookies.adminToken
    let secret = "abc@123"

    try {
        req['adminInfo'] = verify(token, secret)
        next()
    } catch (error) {
        res.json({error:error.message ,message:''})
    }
}

app.get('/', (req, res) => {
    res.render("User/Home");
})

app.get('/admin', (req, res) => {
    res.render("Admin/admin");
})

app.get('/change-password', (req, res) => {
    res.render("User/ChangePassword");
})

app.get('/admin-change-password', (req, res) => {
    res.render("Admin/ChangeAdminPass");
})

app.post('/change-password',customerAuthorization_http_request,admincontroller.ChangePassword)

app.post('/user-forgot-pass',admincontroller.SendOTP)

app.post('/admin-forgot-pass',admincontroller.SendAdminOTP)

app.post('/admin-otp/:email',admincontroller.VerifyAdminOTP)

app.post('/user-otp/:email',admincontroller.VerifyUserOTP)

app.post('/change-admin-password',AdminAuthorization_http_request,admincontroller.ChangeAdminPassword)

app.post('/change-adminotp-password/:email',admincontroller.ChangeAdminOTPPassword)

app.post('/change-userotp-password/:email',admincontroller.ChangeUserOTPPassword)

app.get("/admin-dashboard",AdminAuthorization, (req, res) => {
    // console.log(req.cookies)
    res.render('Admin/dashboard',{data:req['adminInfo']})
})

app.get("/user-forgot-pass", (req, res) => {

    res.render('User/UserForgetPass')
})

app.get("/admin-forgot-pass", (req, res) => {

    res.render('Admin/AdminForgotPass')
})

app.post("/share/:id",admincontroller.ShareContact)

app.get('/favicon.ico', (req, res) => res.status(204));


app.get("/admin-otp/:email", (req, res) => {
    //console.log(req.params)
    res.render('Admin/AdminOTPverification',{email:req.params})
})

app.get("/user-otp/:email", (req, res) => {
    //console.log(req.params)
    res.render('User/UserOTPverification',{email:req.params})
})

app.post("/subscribed",customerAuthorization_http_request,admincontroller.Subscribed)

app.post("/subscribed-yearly",customerAuthorization_http_request,admincontroller.SubscribedYYYY)


app.get("/admin-newpass/:email", (req, res) => {
    //console.log(req.params)
    res.render('Admin/AdminOTPpass',{email:req.params})
})

app.get("/user-newpass/:email", (req, res) => {
    //console.log(req.params)
    res.render('User/UserOTPpass',{email:req.params})
})

app.get("/sign-up", (req, res) => {
    //console.log(req.params)
    res.render('User/index')
})

app.get("/user-dashboard",customerAuthorization, (req, res) => {
    // console.log(req.cookies)
    res.render('User/Userdashboard',{data:req['customerInfo']})
})

app.post('/admin-login',admincontroller.AdminLogin)

app.post('/add-contact',customerAuthorization,admincontroller.AddContact)

app.get("/read-contact",customerAuthorization_http_request, admincontroller.ReadContact)

app.post("/update-contact",customerAuthorization_http_request, admincontroller.UpdateContact)

app.get("/read-user", admincontroller.ReadUsers)

app.get("/read-user-contact/:id",(req,res)=>{
    //console.log(req.params)
    res.render('Admin/Contacts',{id:req.params})
})

app.post('/user-login',admincontroller.UserLogin)

app.get('/user-login-page',(req,res)=>{
    res.render('User/userlogin')
})

app.get("/logout",(req,res)=>{
    res.clearCookie("customerToken");
    res.redirect("/user-login-page");
})

app.get("/admin-logout",(req,res)=>{
    res.clearCookie("adminToken");
    res.redirect("/admin");
})

app.get('/read-user-contacts/:id',AdminAuthorization_http_request,admincontroller.ReadUserContacts)

app.get('/delete-contact/:id',customerAuthorization_http_request,admincontroller.DeleteContacts)


app.post('/add-user',admincontroller.UserSignup)




app.listen(3002,(error)=>{
    if(error){
        console.log(error);
    }else{
        console.log("Server started on port 3002");
    }
})