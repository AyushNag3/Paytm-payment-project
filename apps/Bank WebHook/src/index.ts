import express from "express";
import db from "@repo/db/client"
const app = express();
const cors = require("cors")

app.use(cors());
app.use(express.json())

app.post("/hdfcWebhook", async (req, res) => {
    //TODO: Add zod validation here?
    //TODO: HDFC bank should ideally send us a secret so we know this is sent by them
    const paymentInformation: {
        token: string;
        userId: string;
        amount: string
    } = {
        token: req.body.token,
        userId: req.body.user_id,
        amount: req.body.amount
    };

    try {
        await db.$transaction([    // db/$transaction is written, such that it makes sure that both the balance.updateMany and onRampTransaction.updateMany takes place or none
            db.balance.updateMany({
                where: {
                    userId: Number(paymentInformation.userId)
                },
                data: {
                    amount: {
                        // You can also get this from your DB
                        increment: Number(paymentInformation.amount)
                    }
                }
            }),
            db.onRampTransaction.updateMany({
                where: {
                    token: paymentInformation.token
                }, 
                data: {
                    status: "Success",
                }
            })
        ]);

        res.json({
            message: "Captured"
        })
    } catch(e) {
        console.error(e);
        res.status(411).json({
            message: "Error while processing webhook"
        })
    }

})

app.listen(3003, function(err){
    if (err) console.log("Error in server setup")
    console.log("Server listening on Port", 3003);
})