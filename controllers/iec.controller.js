const express = require('express');
const expressAsyncHandler = require('express-async-handler');
const { registerUserWithIEC, getUserDetails } = require('../services/iec.service');
const ErrorHandler = require('../utils/errorHandler');

const router = express.Router();

// Register user with IEC verification
router.post('/register', expressAsyncHandler(async (req, res, next) => {
    let { iec_code } = req.body;

    // Validate required fields
    if (!iec_code) {
        throw new ErrorHandler(400, 'IEC code is required');
    }

    // Trim and format IEC code
    const formattedIECCode = iec_code.trim().toUpperCase();

    // Register user with IEC verification
    const registeredUser = await registerUserWithIEC(formattedIECCode);

    res.status(201).json({
        success: true,
        message: 'User registered successfully with verified IEC',
        data: {
            user_id: registeredUser.user_id,
            iec_code: registeredUser.iec_code,
            verification_status: registeredUser.verification_status,
            company_details: {
                company_name: registeredUser.company_name,
                address: registeredUser.address,
                city: registeredUser.city,
                state: registeredUser.state,
                pincode: registeredUser.pincode,
                country: registeredUser.country,
                email: registeredUser.company_email,
                phone: registeredUser.company_phone,
                status: registeredUser.status
            },
            created_at: registeredUser.created_at
        }
    });
}));

// GET /api/iec/user/:user_id - Get user details by user_id
router.get('/user/:user_id', expressAsyncHandler(async (req, res, next) => {
    const { user_id } = req.params;

    if (!user_id) {
        throw new ErrorHandler(400, 'User ID is required');
    }

    const user = await getUserDetails(user_id);

    res.status(200).json({
        success: true,
        message: 'User details retrieved successfully',
        data: {
            user_id: user.user_id,
            iec_code: user.iec_code,
            user_email: user.user_email,
            user_phone: user.user_phone,
            verification_status: user.verification_status,
            company_details: {
                company_name: user.company_name,
                address: user.address,
                city: user.city,
                state: user.state,
                pincode: user.pincode,
                country: user.country,
                company_email: user.company_email,
                company_phone: user.company_phone,
                status: user.status
            },
            created_at: user.created_at,
            updated_at: user.updated_at
        }
    });
}));

module.exports = router;
