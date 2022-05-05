const express = require("express");
const app = express();

const registerUser = require('./utils/registerUser');
const pushData = require('./utils/pushData');
const getData = require('./utils/getData');
const encryptData = require("./utils/encryptData");

const port = 3000;
const organisationNumber = 1;
const organisationName = "A";
const key = 5;

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello from the server!");
});

app.post("/register", async (req, res) => {
    const { userId } = req.body;
    if (!userId)
        return res.json({ 
            success: false,
            msg: "UserId is required!"
         });
    try{
        const msg = await registerUser({
            organisationNumber,
            organisationName,
            userId
        });
        res.json({
            success: true,
            msg
        })
    }catch(err){
        res.json({
            success: false,
            msg: err
        })
    }
});

app.post("/push", async (req, res) => {
    const { userId, data} = req.body;
    if (!userId || !data)
        res.json({ 
            success: false,
            msg: "UserId & data is required!"
         });
    try{
        const msg = await pushData({
            organisationNumber,
            organisationName,
            userId,
            data: encryptData(data, key)
        });
        res.json({
            success: true,
            msg
        })
    }catch(err){
        res.json({
            success: false,
            msg: err
        })
    }
});

app.post("/get", async (req, res) => {
    const {userId} = req.body;
    try{
        const msg = await getData({
            organisationNumber,
            organisationName,
            userId
        });
        res.json({
            success: true,
            msg
        })
    }catch(err){
        res.json({
            success: false,
            msg: err
        })
    }
});


app.listen(port, (err) => {
    if (err)
        console.log("Error while starting the server: ", err);
    console.log("Server is up and running on port", port);
});