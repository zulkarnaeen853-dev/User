const User = require('../model/usermodel')
const bcrypt = require('bcrypt')

const register = async (req, res) =>{
    const {name, email, password, phone, address, gender, dateOfBirth } = req.body;
    const existedUser = await User.findOne({email})
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

    if(!name) {
        return res.send({
            success: false,
            message: "name is required"
        })
    }

    if(!email) {
        return res.send({
            success: false,
            message: "Email is required"
        })
    }

    if(!emailRegex.test(email)){
        return res.send({
            success: false,
            message: "Please enter a valid email address" 
        })
    }

    if(!password) {
        return res.send({
            success: false,
            message: "password is required"
        })
    }

    if(password.length < 6) {
        return res.send({
            success: false, 
            message: "Password must be at least 6 characters long" 
        });
    }

    if(!phone) {
        return res.send({
            success: false,
            message: "Phone number is required"
        })
    }

    if(!address) {
        return res.send({
            success: false,
            message: "Address is required"
        })
    }
    
    if(!gender) {
        return res.send({
            success: false,
            message: "Gender is required"
        })
    }

    if(!dateOfBirth) {
        return res.send({
            success: false,
            message: "Birth date is required"
        })
    }

    if (existedUser) {
        return res.send({
            success: false,
            message: "User already exist"
        })
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const RegisteredUser = await new User({
        name, 
        email, 
        password: hashedPassword, 
        phone, 
        address, 
        gender, 
        dateOfBirth
    })

    await RegisteredUser.save()

    return res.status(201).send({
            success: true,
            message: "User registered successfully!",
            data: {
                name,
                email
            }
        });
}

module.exports = register