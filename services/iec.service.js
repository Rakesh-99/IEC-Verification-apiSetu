const IECModel = require('../models/iec.model');
const ErrorHandler = require('../utils/errorHandler');

// Verify IEC code through API Setu
const verifyIECFromAPI = async (iecCode) => {
    try {
        // APISetu IEC Verification API endpoint - Version 3
        const apiUrl = `https://apisetu.gov.in/dgft/v3/iec/${iecCode}`;
        
        console.log('Calling IEC API with:', {
            url: apiUrl,
            iecCode,
            hasApiKey: !!process.env.APISETU_API_KEY,
            hasClientId: !!process.env.APISETU_CLIENT_ID
        });
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-APISETU-APIKEY': process.env.APISETU_API_KEY || '',
                'X-APISETU-CLIENTID': process.env.APISETU_CLIENT_ID || ''
            }
        });

        console.log('API Response Status:', response.status);
        console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('API Error Response:', errorData);
            throw new ErrorHandler(
                response.status,
                errorData.errorDescription || errorData.message || `Failed to verify IEC code from external API (Status: ${response.status})`
            );
        }

        const data = await response.json();
        console.log('API Success Response:', data);
        
        // Check if IEC is valid based on API response (v3 structure)
        if (!data || !data.iecNumber) {
            throw new ErrorHandler(404, 'Invalid IEC code. Please check and try again.');
        }

        return data;
    } catch (error) {
        console.error('verifyIECFromAPI error:', error);
        if (error instanceof ErrorHandler) {
            throw error;
        }
        throw new ErrorHandler(500, `IEC verification failed: ${error.message}`);
    }
};

// Parse and format company data from API response (Version 3)
const formatCompanyData = (apiResponse, iecCode) => {
    return {
        iec_code: iecCode,
        company_name: apiResponse.entityName || 'N/A',
        address: `${apiResponse.address1 || ''} ${apiResponse.address2 || ''}`.trim() || 'N/A',
        city: apiResponse.city || null,
        state: apiResponse.state || null,
        pincode: apiResponse.pinCode ? String(apiResponse.pinCode) : null,
        country: 'India',
        email: null, // V3 API doesn't provide email
        phone: null, // V3 API doesn't provide phone directly
        status: apiResponse.iecStatus === 0 ? 'active' : 'inactive',
        registration_date: null,
        valid_from: apiResponse.iecIssueDate || null,
        valid_to: null,
        raw_api_response: apiResponse
    };
};

// Verify and store/update IEC company details
const verifyAndStoreIEC = async (iecCode) => {
    // Check if IEC already exists in database
    const existingCompany = await IECModel.findByIECCode(iecCode);

    if (existingCompany) {
        // Return existing company data if already verified
        return {
            isNew: false,
            company: existingCompany
        };
    }

    // Verify IEC from external API
    const apiResponse = await verifyIECFromAPI(iecCode);

    // Format company data
    const companyData = formatCompanyData(apiResponse, iecCode);

    // Store in database
    await IECModel.createIECCompany(companyData);

    // Fetch and return the saved data
    const savedCompany = await IECModel.findByIECCode(iecCode);

    return {
        isNew: true,
        company: savedCompany
    };
};

// Generate unique user ID
const generateUserId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `USR${timestamp}${random}`;
};

// Register user with verified IEC
const registerUserWithIEC = async (iec_code) => {
    try {
        console.log('Starting registration for IEC:', iec_code);
        
        // Validate required fields
        if (!iec_code) {
            throw new ErrorHandler(400, 'IEC code is required');
        }

        // Check if this IEC code is already registered
        console.log('Checking if IEC is already registered...');
        const iecExists = await IECModel.checkIECRegistered(iec_code);
        if (iecExists) {
            throw new ErrorHandler(409, 'This IEC code is already registered. Each IEC can only be registered once.');
        }

        // Verify and store/fetch IEC details
        console.log('Verifying and storing IEC details...');
        const { company } = await verifyAndStoreIEC(iec_code);

        // Check if company is active
        if (company.status !== 'active') {
            throw new ErrorHandler(
                403,
                `Cannot register with this IEC code. Company status: ${company.status}`
            );
        }

        // Auto-generate user_id
        const user_id = generateUserId();
        console.log('Generated user_id:', user_id);

        // Register user with company email and phone from IEC API
        console.log('Registering user in database...');
        await IECModel.registerUser({
            user_id,
            iec_code,
            user_email: company.email || null,
            user_phone: company.phone || null,
            verification_status: 'verified'
        });

        // Fetch complete user details
        console.log('Fetching registered user details...');
        const registeredUser = await IECModel.findUserByUserId(user_id);

        console.log('Registration successful!');
        return registeredUser;
    } catch (error) {
        console.error('Error in registerUserWithIEC:', error);
        throw error;
    }
};

// Get user details by user_id
const getUserDetails = async (userId) => {
    const user = await IECModel.findUserByUserId(userId);
    
    if (!user) {
        throw new ErrorHandler(404, 'User not found');
    }

    return user;
};

module.exports = { verifyIECFromAPI, formatCompanyData, verifyAndStoreIEC, generateUserId, registerUserWithIEC, getUserDetails };
