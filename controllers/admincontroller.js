const express = require('express');
const router = express.Router();
const connection=require('../connection');
const{sign } = require('jsonwebtoken');
const nodemailer=require('nodemailer');
const Razorpay = require("razorpay");
const {NULL} = require("mysql/lib/protocol/constants/types");

async function UserSignup(req,res){
    //console.log(req.body)
    const {name,email,password} = req.body
    const checkEmailQuery = `SELECT * FROM user WHERE email = '${email}'`
    connection.query(checkEmailQuery, (error, results) => {
        if (error) {
            res.json({error: error.message})
        } else if (results.length > 0) {
            res.json({error: 'Email already registered'})
        } else {
            const insertquery = `insert into user (name,email,password)values('${name}','${email}','${password}')`

            connection.query(insertquery, (error) => {
                if (error) {
                   // console.log("error")
                    res.json({error: error.message})
                } else {
                    let transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: 'parasmarwaha246@gmail.com',
                            pass: 'auxq kiup dcan wlzi'
                        }
                    });

                    let mailOptions = {
                        from: 'parasmarwaha246@gmail.com',
                        to: email,
                        subject: 'Sending Email using Node.js',
                        text: 'That was easy!'
                    };

                    transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                            res.json({error:error.message ,message: ''})
                        } else {
                            res.json({error:'',message: "User signup successfully."})
                        }
                    });

                }
            })
        }
    })

}

async function AdminLogin(req,res){
    //console.log(req.body)
    let {email, password}= req.body

    if(email == '' || password== ''){
        res.json({error:'ALL FIELDS ARE REQUIRED', message:''})
    }else{
        // Authentication
        let checkUser= `SELECT * FROM admin WHERE email = '${email}' and password = '${password}'`
        //console.log(checkUser)
        connection.query(checkUser,(error,record)=>{
            if(error){
                res.json({error: error.message, message :''})
            }else{
                // console.log(record.length)
                if(record.length == 0){
                    res.json({error:"Invalid Email or Password", message: ''})
                }else{
                    // console.log(record)
                    let payload = {
                        id : record[0].id,
                        email: record[0].email,
                        name :record[0].name
                    }
                    let secret = "abc@123"
                    let expiry = 60 * 60

                    let token = sign(payload,secret,{expiresIn:expiry})
                    //console.log(token)

                    res.cookie('adminToken',token,
                        {expires : new Date (Date.now() + expiry  * 1000)})

                    res.json({error: '', message :'Login Success'})
                }
            }
        })

    }
}

async function UserLogin(req,res){
    //console.log(req.body)
    let {email, password}= req.body

    if(email == '' || password== ''){
        res.json({error:'ALL FIELDS ARE REQUIRED', message:''})
    }else{
        // Authentication
        let checkUser= `SELECT * FROM user WHERE email = '${email}' and password = '${password}'`
        //console.log(checkUser)
        connection.query(checkUser,(error,record)=>{
            if(error){
                res.json({error: error.message, message :''})
            }else{
                // console.log(record.length)
                if(record.length == 0){
                    res.json({error:"Invalid Email or Password", message: ''})
                }else{
                    // console.log(record)
                    let payload = {
                        id : record[0].id,
                        email: record[0].email,
                        name :record[0].name
                    }
                    let secret = "abc@123"
                    let expiry = 60 * 60

                    let token = sign(payload,secret,{expiresIn:expiry})
                    //console.log(token)

                    res.cookie('customerToken',token,
                        {expires : new Date (Date.now() + expiry  * 1000)})

                    res.json({error: '', message :'Login Success'})
                }
            }
        })

    }
}

async function AddContact(req,res){
    //console.log(req.body)
    let{id} =req['customerInfo']
   // console.log(req.files.photo.name)
    let {nameUser,contact} =req.body;

    if(!req.files || !req.body.contact || !req.body.nameUser){
        res.json({error: 'Please Enter Required Data' ,message :''})
    }else{
        let{photo} = req.files
       // console.log(photo.name)
        let serverPath = `public/images/${photo.name}`;
        let dbPath = `/images/${photo.name}`

        let currentDate = new Date();

        let maxcontact = `SELECT u.*, COUNT(ci.user_id) AS count FROM user u
                                 LEFT JOIN contactInfo ci ON u.id = ci.user_id WHERE u.id = ${id}
                                 GROUP BY u.id;`;
       // console.log(maxcontact)
        connection.query(maxcontact,(err,record)=>{
           // console.log(record[0].subscription)
            if (err){
                res.json({error:err.message ,message :''})
            }else if (record[0].count >=10 && record[0].subscription === null ){
                res.json({error:`Open Modal`,message:''})
            }else if (currentDate > record[0].expiryDate && record[0].expiryDate!== null){
                res.json({error:`Open Modal`,message:''})
            }
            else{
                photo.mv(serverPath,(error)=>{
                    if(error){
                        res.json({error:error.message,message:''})
                    }else{
                        const insert = `insert into contactInfo (name,contact,user_id,photo)values('${nameUser}','${contact}','${id}','${dbPath}')`
                        // console.log(insert)
                        connection.query(insert,(error)=>{
                            if(error){
                                res.json({error: error.message ,message :''})
                            }else{

                                res.json({error:"", message :'Contact Added'})

                            }
                        })
                    }
                })
            }
        })


    }
}

async function ReadContact(req,res){
    let {id} =req['customerInfo']
    const fetchUser = `Select* from contactInfo where user_id= ${id} `;
    connection.query(fetchUser,(error,records)=>{
        if(error){
            res.json({
                error: error.message,
                records: []})
        }else{
            // console.log(records)
            res.json({error:'',records: records})

        }
    })
}

async function ReadUsers(req,res){
    const fetchUser = `Select* from user  `;
    connection.query(fetchUser,(error,records)=>{
        if(error){
            res.json({
                error: error.message,
                records: []})
        }else{
            // console.log(records)
            res.json({error:'',records: records})

        }
    })
}

async function ReadUserContacts(req,res){
    let{id} = req.params
    const fetchUser = `Select* from contactInfo where user_id = ${id} `;
    connection.query(fetchUser,(error,records)=>{
        if(error){
            res.json({
                error: error.message,
                records: []})
        }else{
            // console.log(records)
            res.json({error:'',records: records})

        }
    })
}

async function DeleteContacts(req,res){
    console.log(req.params)
    let {id} = req.params
    const deleteuser = `delete from contactInfo where id= ${id} `
    // console.log(deleteuser)
    connection.query(deleteuser, (error)=>{
        if(error){
            res.json({error: error.message, message:''})
        }else{
            res.json({error: '' , message: 'User Record Deleted.'})
        }
    })
}

async function UpdateContact(req,res){
    //console.log(req.body)
    let{contact_id,name,contact} =req.body;

    const update = `update contactInfo Set name= '${name}', contact = ${contact} where id = ${contact_id}  `
    //console.log(update)
    connection.query(update, (error)=>{
        if(error){
            res.json({error: error.message, message:''})
        }else{
            res.json({error: '' , message: 'Contact Updated'})
        }
    })
}

async function ChangePassword(req,res) {
    //console.log(req.body)
    let {id} = req['customerInfo']
    //console.log(req['customerInfo'])
    let {current, newpass, confirm} = req.body;

    if (!current || !newpass || !confirm) {
        res.json({error: 'All fields are required'});
    } else if (newpass !== confirm) {
        res.json({error: 'New password and confirm password do not match'});
    } else {
        const query = `SELECT password FROM user WHERE id = ${id}`;
        //console.log(query)
        connection.query(query, (error, results) => {
            //console.log(results)
            if (error) {
                console.log('error')
                res.json({error: 'Error fetching current password',message:''});
            } else if (results[0].password !== current) {
                console.log('error2')
                 res.json({error: 'Incorrect current Password',message:''});
            }else {
                const update = `UPDATE user SET password =${newpass} WHERE id = ${id}`;
                connection.query(update, (error, results) => {
                    if (error) {
                        res.json({error: error.message,message:''});
                    }else{
                        res.json({error:'',message:'Password Changed Successfully'})
                    }
                })
            }
        })
    }
}

async function ChangeAdminPassword(req,res) {
    //console.log(req.body)
    let {id} = req['adminInfo']
    //console.log(req['customerInfo'])
    let {current, newpass, confirm} = req.body;

    if (!current || !newpass || !confirm) {
        res.json({error: 'All fields are required'});
    }  else {
        const query = `SELECT password FROM admin WHERE id = ${id}`;
       // console.log(query)
        connection.query(query, (error, results) => {
           // console.log(results[0].password)
            if (error) {
              //  console.log('error')
                res.json({error: 'Error fetching current password',message:''});

            }else if ( results[0].password !== current) {
                res.json({error: 'Incorrect Current Password'});
            }
            else if (newpass !== confirm  ) {
               // console.log('error2')
                res.json({error: 'New password and confirm password do not match',message:''});
            }else {
                const update = `UPDATE admin SET password =${newpass} WHERE id = ${id}`;
               // console.log(update)
                connection.query(update, (error) => {
                    if (error) {
                        res.json({error: error.message,message:''});
                    }else{
                        res.json({error:'',message:'Password Changed Successfully'})
                    }
                })
            }
        })
    }
}

async function SendOTP(req,res){
    //console.log(req.body)
    let {email} = req.body;
    if(!email || !email.length) {
        res.json({error: 'Please enter email'});
    }else{
        let check = `select email from user where email= '${email}'`;
        //console.log(check)
        connection.query(check, (error, results) => {
            //console.log(results[0].email)
            //console.log(email)
            if (error){
                res.json({error: error.message,message:''});
            }else if(results.length ===0) {
                res.json({error: 'Email does not exist'});
            }else {
                // Generate a random OTP (e.g., 6-digit number)
                const otp = Math.floor(100000 + Math.random() * 900000);
                //console.log(otp)
                let generateotp = `update user set otp = ${otp} where email= '${email}'`;
                // console.log(generateotp)
                connection.query (generateotp, (error, results) => {
                    if (error) {
                        res.json({error: error.message,message:''});
                    }else{
                        // Send OTP to the email address using a mailer service (e.g., Nodemailer)
                        const transporter = nodemailer.createTransport({
                            host: 'smtp.gmail.com',
                            port: 587,
                            secure: false, // or 'STARTTLS'
                            auth: {
                                user: 'parasmarwaha246@gmail.com',
                                pass: 'auxq kiup dcan wlzi'
                            }
                        });

                        const mailOptions = {
                            from: 'parasmarwaha246@gmail.com',
                            to: email,
                            subject: 'User OTP Verification',
                            text: `Your OTP is: ${otp}`
                        };
                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                res.json({ error: 'Failed to send OTP',message:'' });
                            }

                            // console.log('OTP sent to', email);
                            res.json({error:'', message: 'OTP sent successfully' });
                        });
                    }
                })
            }
        })
    }
}

async function SendAdminOTP(req,res){
    //console.log(req.body)
    let {email} = req.body;
    if(!email || !email.length) {
        res.json({error: 'Please enter email'});
    }else{
        let check = `select email from admin where email= '${email}'`;
        //console.log(check)
        connection.query(check, (error, results) => {
            //console.log(results[0].email)
            //console.log(email)
            if (error){
                res.json({error: error.message,message:''});
            }else if(results.length ===0) {
                res.json({error: 'Email does not exist'});
            }else {
                // Generate a random OTP (e.g., 6-digit number)
                const otp = Math.floor(100000 + Math.random() * 900000);
                //console.log(otp)
                let generateotp = `update admin set otp = ${otp} where email= '${email}'`;
               // console.log(generateotp)
                connection.query (generateotp, (error, results) => {
                    if (error) {
                        res.json({error: error.message,message:''});
                    }else{
                        // Send OTP to the email address using a mailer service (e.g., Nodemailer)
                        const transporter = nodemailer.createTransport({
                            host: 'smtp.gmail.com',
                            port: 587,
                            secure: false, // or 'STARTTLS'
                            auth: {
                                user: 'parasmarwaha246@gmail.com',
                                pass: 'auxq kiup dcan wlzi'
                            }
                        });

                        const mailOptions = {
                            from: 'parasmarwaha246@gmail.com',
                            to: email,
                            subject: 'Admin OTP Verification',
                            text: `Your OTP is: ${otp}`
                        };
                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                res.json({ error: 'Failed to send OTP',message:'' });
                            }

                           // console.log('OTP sent to', email);
                            res.json({error:'', message: 'OTP sent successfully' });
                        });
                    }
                })


            }
        })
    }
}

async function VerifyAdminOTP(req,res){
    //console.log(req.params)
   // console.log("here")
    let {email} = req.params ;
    let {adminotp} = req.body ;
    if(!adminotp){
        res.json({error:'Please enter otp',message:''});
    }else {
        let check = `select email from admin where email= '${email}'`;
        //console.log(check)
        connection.query(check, (error, results) => {
            //console.log(results[0].email)
            //console.log(email)
            if (error){
                res.json({error: error.message,message:''});
            }else if(results.length ===0) {
                res.json({error: 'Email does not exist'});
            }else {
                let getotp = `select otp from admin where email= '${email}' `;
                //console.log(getotp);
                connection.query(getotp, (error, results) => {
                    //  console.log(results[0].otp)
                    if (error) {
                        res.json({error: error.message,message:''});
                    }else if(results[0].otp !== adminotp) {
                        res.json({error:'Enter correct OTP',message:''});
                    }else{
                        let nullotp = `update admin set otp = NULL where email= '${email}'`;
                        // console.log(nullotp)
                        connection.query(nullotp, (error, results) => {
                            if (error) {
                                res.json({error: error.message,message:''});
                            } else{
                                res.json({error:'', message:'Verified '});
                            }
                        })
                    }
                })

            }
        })


    }
}

async function ChangeAdminOTPPassword(req,res) {
    //console.log(req.body)
    let {email} = req.params;
    //console.log(req['customerInfo'])
    let {newpass, confirm} = req.body;

    if (!newpass || !confirm) {
        res.json({error: 'All fields are required'});
    } else if (newpass !== confirm) {
        res.json({error: 'New password and confirm password do not match'});
    } else {
        let check = `select email from admin where email= '${email}'`;
        //console.log(check)
        connection.query(check, (error, results) => {
            //console.log(results[0].email)
            //console.log(email)
            if (error) {
                res.json({error: error.message, message: ''});
            } else if (results.length === 0) {
                res.json({error: 'Email does not exist'});
            } else {
                const query = `UPDATE admin set password = '${newpass}' WHERE email = '${email}'`;
                // console.log(query)
                connection.query(query, (error, results) => {
                    if (error) {
                        res.json({error: error.message, message: ''});
                    } else {
                        res.json({error: '', message: 'Password Changed Successfully'})
                    }
                })
            }
        })
    }
}

async function VerifyUserOTP(req,res) {
    //console.log(req.params)
    // console.log("here")
    let {email} = req.params;
    let {adminotp} = req.body;
    if (!adminotp) {
        res.json({error: 'Please enter otp', message: ''});
    } else {
        let check = `select email from user where email= '${email}'`;
        //console.log(check)
        connection.query(check, (error, results) => {
            //console.log(results[0].email)
            //console.log(email)
            if (error) {
                res.json({error: error.message, message: ''});
            } else if (results.length === 0) {
                res.json({error: 'Email does not exist'});
            } else {
                let getotp = `select otp from user where email= '${email}' `;
                //console.log(getotp);
                connection.query(getotp, (error, results) => {
                    //  console.log(results[0].otp)
                    if (error) {
                        res.json({error: error.message,message:''});
                    }else if(results[0].otp !== adminotp) {
                        res.json({error:'Enter correct OTP',message:''});
                    }else{
                        let nullotp = `update user set otp = NULL where email= '${email}'`;
                        // console.log(nullotp)
                        connection.query(nullotp, (error, results) => {
                            if (error) {
                                res.json({error: error.message,message:''});
                            } else{
                                res.json({error:'', message:'Verified '});
                            }
                        })
                    }
                })
            }

        })
    }
}

async function ChangeUserOTPPassword(req,res) {
    //console.log(req.body)
    let {email} = req.params;
    //console.log(req['customerInfo'])
    let {newpass, confirm} = req.body;

    if (!newpass || !confirm) {
        res.json({error: 'All fields are required'});
    } else if (newpass !== confirm) {
        res.json({error: 'New password and confirm password do not match'});
    } else {
        let check = `select email from user where email= '${email}'`;
        //console.log(check)
        connection.query(check, (error, results) => {
            //console.log(results[0].email)
            //console.log(email)
            if (error) {
                res.json({error: error.message, message: ''});
            } else if (results.length === 0) {
                res.json({error: 'Email does not exist'});
            } else {
                const query = `UPDATE user set password = '${newpass}' WHERE email = '${email}'`;
                //console.log(query)
                connection.query(query, (error, results) => {
                    if (error) {
                        res.json({error: error.message,message:''});
                    }else{
                        res.json({error:'',message:'Password Changed Successfully'})
                    }
                })
            }
        })
    }
}

async function ShareContact(req,res){
    let {id} = req.params ;
   // console.log(id)

    try{
        const fetchUser = `Select * from contactInfo where id = ${id} `;
        connection.query(fetchUser,(error,records,)=>{
            if(error){
                res.json({
                    error:"Error Occur",
               message:''},
                )}
            else{
               // console.log(records)
              //  console.log(records[0].name)

                // Generate a shareable link

                // Create social media links
                 const socialMediaLinks = {
                     whatsapp: `https://wa.me/?text=Check out ${records[0].name}'s Contact: ${records[0].contact}`,
                     facebook: `https://www.facebook.com/sharer/sharer.php?u=https://example.com/user/${records[0].id}&quote=${records[0].name}'s contact: ${records[0].contact}`,
                     twitter: `https://twitter.com/intent/tweet?url=https://example.com/user/${records[0].id}&text=${records[0].name}'s contact: ${records[0].contact}`,
                     linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=https://example.com/user/${records[0].contact}`,
                 }
                 res.json({error:'' , socialMediaLinks : socialMediaLinks});
             }
         })
    } catch (error) {
        console.error(error);
        res.json({ error: 'Internal Server Error', message: 'An unexpected error occurred' });

    }

}

async function Subscribed(req,res){


  // console.log(req['customerInfo'])

    let {id} = req['customerInfo'];
    let add = `Update user set subscription = 'Done',expiryDate=DATE_ADD(CURDATE(), INTERVAL 30 DAY), subcriptionName = 'Monthly' where id = ${id}`
    connection.query(add, (error, results) => {
        if (error) {
            res.json({error: error.message,message:''});
        }else{
            res.json({error:'',message:'Enjoy Your Subscription'});

        }
    })
}

async function SubscribedYYYY(req,res){


    // console.log(req['customerInfo'])

    let {id} = req['customerInfo'];
    let add = `Update user set subscription = 'Done',expiryDate=DATE_ADD(CURDATE(), INTERVAL 365 DAY), subcriptionName = 'Yearly' where id = ${id}`
    connection.query(add, (error, results) => {
        if (error) {
            res.json({error: error.message,message:''});
        }else{
            res.json({error:'',message:'Enjoy Your Subscription'});

        }
    })
}



module.exports = {
    UserSignup,
    AdminLogin,
    UserLogin,
    AddContact,
    ReadContact,
    ReadUsers,
    ReadUserContacts,
    DeleteContacts,
    UpdateContact,
    ChangePassword,
    ChangeAdminPassword,
    SendOTP,
    SendAdminOTP,
    VerifyAdminOTP,
    ChangeAdminOTPPassword,
    VerifyUserOTP,
    ChangeUserOTPPassword,
    ShareContact,
    Subscribed,
    SubscribedYYYY
}