const User = require('../model/usermodel')

const authmiddleware = (req, res, next) =>{
    const {name, email, password, phone, address, gender, dateOfBirth } = req.body;
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        const internationalRegex = /^\+?[1-9]\d{6,14}$/;
        const standardGenderRegex = /^(male|female|non-binary|other|prefer\s*not\s*to\s*say|pnts)$/i;
        const dobRegex = /^(0[1-9]|[12][0-9]|3[01])[- \/.](0[1-9]|1[012])[- \/.](19|20)\d\d$/;
    
        
                                                // name part
    
        if(!name) {
            return res.send({
                success: false,
                message: "Name is required"
            })
        } 
        if(name.length < 6) {
            return res.send({
                success: false,
                message: "Name must be at least 6 characters long"
            })
        } 
    
                                                // email part
    
        if(!email) {
            return res.send({
                success: false,
                message: "Email is required"
            })
        } 
        if(!emailRegex.test(email)){
            return res.send({
                success: false,
                message: "Please enter a valid email address."
            })
        }
    
                                                // password part
    
        if(!password) {
            return res.send({
                success: false,
                message: "Password is required"
            })
        }
        if(password.length < 6) {
            return res.send({
                success: false, 
                message: "Password must be at least 6 characters long" 
            });
        }
    
                                                // phone number part
    
        if(!phone) {
            return res.send({
                success: false,
                message: "Phone number is required"
            })
        }
        if(!internationalRegex.test(phone)) {
            return res.send({
                success: false,
                message: "Please enter a valid phone number."
            })
        }
    
                                                // address part
    
        if(!address) {
            return res.send({
                success: false,
                message: "Address is required."
            })
        } 
    
        
                                                // gender part
        
        if(!gender) {
            return res.send({
                success: false,
                message: "Gender is required."
            })
        }  
        if(!standardGenderRegex.test(gender)) {
            return res.send({
                success: false,
                message: "Please enter a valid gender."
            })
        }
    
                                                // date of birth
    
        if (!dateOfBirth) {
            return res.send({
                success: false,
                message: "Birth date is required."
            })
        }  
        if (!dobRegex.test(dateOfBirth)) {
            return res.send({
                success: false,
                message: "Birth date must be in DD-MM-YYYY format."
            })
        }

        next()
}

module.exports = authmiddleware