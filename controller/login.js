const User = require('../model/usermodel')
const bcrypt = require('bcrypt')

const login = async (req, res) => {
    try {

        const { email, password } = req.body
        const existedEmail = await User.findOne({ email }).select('+password')

        // 3. Properly check if the user exists
        if (!existedEmail) {
            return res.send({
                success: false,
                message: "Email does not exist."
            })
        }

        
        const isPasswordCorrect = await bcrypt.compare(password, existedEmail.password)

        if (!isPasswordCorrect) {
            return res.send({
                success: false,
                message: "Wrong Password."
            })
        }

        res.send({
            success: true,
            message: "User logged in successfully.",
            data: {
                id: existedEmail._id,
                name: existedEmail.name,
                email: existedEmail.email
            }
        })

    } catch (error) {
        res.status(500).send({
            success: false,
            message: "Something went wrong on the server."
        })
    }
}

module.exports = login
