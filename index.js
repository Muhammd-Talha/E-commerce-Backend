const express = require("express");
const cors = require("cors")
require("./db/config");
const User = require('./db/User')
const Product = require("./db/Product")

const Jwt = require("jsonwebtoken")
const jwtkey = "e-comm"

const app = express(); 

app.use(express.json())
app.use(cors())

app.post("/register" ,async (req, resp) => {
    let user = new User(req.body)
    let result = await user.save();
    result = result.toObject();
    delete result.password
    // resp.send(result)
    Jwt.sign({ result }, jwtkey, { expiresIn: "1h" }, (err, token) => {
        if (err) {
            resp.send({ result: "Something went wrong please try after some time" })
        }
        resp.send({ result, auth: token })
    })
})

app.post("/login", async (req, resp) => {
    console.log(req.body);
    if (req.body.email && req.body.password) { 
        let user = await User.findOne(req.body).select("-password")
        if (user) {
            Jwt.sign({ user }, jwtkey, { expiresIn: "1h" }, (err, token) => {
                if (err) {
                    resp.send({ result: "Something went wrong please try after some time" })
                }
                resp.send({ user, auth: token })
            })
        }
        else {
            resp.send({ result: "No user found" })
        }
    }
    else {
        resp.send({ result: "No user found" })
    }
})

app.post("/add-product" ,verifytoken ,async (req, resp) => { 
    let product = new Product(req.body);
    let result = await product.save()
    resp.send(result)
})

app.get('/products' ,verifytoken ,async (req, resp) => {
    let products = await Product.find()
    if (products.length > 0) {
        resp.send(products)
    }
    else {
        resp.send({ result: "No products Found" })
    }
})

app.delete("/product/:id",  verifytoken ,async (req, resp) => {
    const result = await Product.deleteOne({ _id: req.params.id });
    resp.send(result) 
})

app.get("/product/:id" ,verifytoken ,async (req, resp) => {
    const result = await Product.findOne({ _id: req.params.id });
    if (result) {
        resp.send(result)
    }
    else {
        resp.send({ result: "No products Found" })
    }
})

app.put("/product/:id" ,verifytoken ,async (req, resp) => {
    let result = await Product.updateOne(
        { _id: req.params.id },
        {
            $set: req.body
        }
    )
    resp.send(result) 
})

app.get("/search/:key", verifytoken, verifytoken ,async (req, resp) => {
    let result = await Product.find({
        "$or": [
            { name: { $regex: req.params.key } },
            { price: { $regex: req.params.key } },
            { company: { $regex: req.params.key } },
            { category: { $regex: req.params.key } },
        ]
    })
    resp.send(result)
})
 
 
function verifytoken(req, resp, next) {
    let token = req.headers['authorization']
    if (token) {
        token = token.split(' ')[1]
        // console.log("middleware called", token);
        // verify with the help of function 
        Jwt.verify(token, jwtkey, (err, valid) => {
            if (err) {
                resp.status(401).send({ result: "Please provide valid token " })        //invalid token 401 status
            }
            else {
                next();
            }
        })
    }
    else {
        resp.status(403).send({ result: "Please add token with headers" })

    }

}
app.listen(5000)






