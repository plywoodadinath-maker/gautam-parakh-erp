const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const razorpay = new Razorpay({
    key_id: 'rzp_test_XXXXXX',        // Replace with your Key ID
    key_secret: 'XXXXXX'               // Replace with your Key Secret
});

// Create an order
app.post('/create-order', async (req, res) => {
    const { plan, amount } = req.body; // amount in INR
    const options = {
        amount: amount * 100, // convert to paisa
        currency: "INR",
        receipt: `order_rcptid_${Date.now()}`,
        payment_capture: 1
    };

    try {
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Verify payment & generate license
app.post('/verify-payment', (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', razorpay.key_secret)
                                    .update(body.toString())
                                    .digest('hex');

    if (expectedSignature === razorpay_signature) {
        // Payment successful
        const licenseKey = `GPARAKH-${Date.now()}-${Math.floor(Math.random()*100000)}`;
        // Save license in DB if you want
        res.json({ success: true, licenseKey });
    } else {
        res.json({ success: false });
    }
});

app.listen(4000, () => console.log('Payment server running on port 4000'));
