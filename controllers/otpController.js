const axios = require('axios');
const OtpModel = require('../models/otpModel');


exports.sendOtp = async (req, res) => {
    const { phoneNumber } = req.body;
    const otp = Math.floor(1000 + Math.random() * 9000).toString(); 

    try {

        await OtpModel.findOneAndUpdate(
            { phoneNumber },
            { otp, expiresAt: new Date(Date.now() + 5 * 60000) },
            { upsert: true, new: true }
        );
        console.log(otp);

        const response = await axios.get(`https://pgapi.vispl.in/fe/api/v1/multiSend?username=aditrpg1.trans&password=9x7Dy&unicode=false&from=ADIUNV&to=${phoneNumber}&text=Your+OTP+for+blood+donation+registration+is+${otp}.+Please+complete+verification+within+5+minutes.+Do+not+share+this+with+anyone.@Aditya+University`);
        
        if (response.data.submitResponses[0].statusCode == 200) {
            console.log("OTP sent successfully");
            res.status(200).send('OTP sent successfully');
        }
        else {
            console.log(response.data)
            res.status(500).send('Failed to send OTP. Please try again.');
        }

        
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).send('Failed to send OTP');
    }
};

// -------------------------------------------------------------------------------------------------------------------------------

exports.verifyOtp = async (req, res) => {
    console.log(req.body)
    const { phoneNumber, otp } = req.body;

    try {
        const otpRecord = await OtpModel.findOne({ phoneNumber });

        if (!otpRecord) {
            return res.status(400).send('OTP not found. Please request a new OTP.');
        }
        if (new Date() > otpRecord.expiresAt) {
            console.log(otpRecord.expiresAt)
            return res.status(400).send('OTP expired. Please request a new OTP.');
        }
        if (otpRecord.otp != otp) {
            return res.status(400).send('Invalid OTP. Please try again.');
        }

        res.status(200).send('OTP verified successfully');
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).send('Error verifying OTP');
    }
};
