const LoginSchema = require('../models/LoginSchema');


const validateLogin = async (req, res) => {
    const {username, password} = req.body;
    try {
        const user = await LoginSchema.findOne({username});
        if (!user) {
            return res.status(401).json({message: 'Invalid credentials'});
        }
        else if (user.password !== password) {
            return res.status(401).json({message: 'Invalid credentials'});
        }
        else return res.status(200).json({message: 'Login Successful'});
    }
    catch(e) {
        console.error(e);
        return res.status(500).json({message: 'Server Error'});
    }
}

exports.validateLogin = validateLogin;


