const User = require('../model/usermodel')
const bcrypt = require('bcrypt')

const register = async (req, res) => {
    try {
        const { name, email, password, phone, address, gender, dateOfBirth } = req.body
        const existedUser = await User.findOne({ email })

        if (existedUser) {
            return res.send({
                success: false,
                message: "User already exists."
            })
        }

        // Securely hash the password before saving
        const hashedPassword = await bcrypt.hashSync(password, 10);

        const RegisteredUser = await User.create({
            name, 
            email, 
            password: hashedPassword, 
            phone, 
            address, 
            gender, 
            dateOfBirth
        })

      
        res.send({
            success: true,
            message: "User registered successfully.",
            data: {
                id: RegisteredUser._id,
                name: RegisteredUser.name,
                email: RegisteredUser.email
            }
        });
        
    } catch (error) {
        res.status(500).send({
            success: false,
            message: "Server error during registration."
        })
    }
}

module.exports = register;
