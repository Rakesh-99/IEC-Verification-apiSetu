const pool = require('../configs/db.config');

class IECModel {
    // Check if IEC code exists in database
    static async findByIECCode(iecCode) {
        const [rows] = await pool.execute(
            'SELECT * FROM iec_companies WHERE iec_code = ?',
            [iecCode]
        );
        return rows[0] || null;
    }

    // Save IEC company details
    static async createIECCompany(companyData) {
        const {
            iec_code,
            company_name,
            address,
            city,
            state,
            pincode,
            country,
            email,
            phone,
            status,
            registration_date,
            valid_from,
            valid_to,
            raw_api_response
        } = companyData;

        const [result] = await pool.execute(
            `INSERT INTO iec_companies 
            (iec_code, company_name, address, city, state, pincode, country, email, phone, 
             status, registration_date, valid_from, valid_to, raw_api_response) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                iec_code,
                company_name,
                address,
                city,
                state,
                pincode,
                country,
                email,
                phone,
                status,
                registration_date,
                valid_from,
                valid_to,
                JSON.stringify(raw_api_response)
            ]
        );
        return result;
    }

    // Update IEC company details
    static async updateIECCompany(iecCode, companyData) {
        const {
            company_name,
            address,
            city,
            state,
            pincode,
            country,
            email,
            phone,
            status,
            registration_date,
            valid_from,
            valid_to,
            raw_api_response
        } = companyData;

        const [result] = await pool.execute(
            `UPDATE iec_companies 
            SET company_name = ?, address = ?, city = ?, state = ?, pincode = ?, 
                country = ?, email = ?, phone = ?, status = ?, registration_date = ?, 
                valid_from = ?, valid_to = ?, raw_api_response = ?, updated_at = CURRENT_TIMESTAMP
            WHERE iec_code = ?`,
            [
                company_name,
                address,
                city,
                state,
                pincode,
                country,
                email,
                phone,
                status,
                registration_date,
                valid_from,
                valid_to,
                JSON.stringify(raw_api_response),
                iecCode
            ]
        );
        return result;
    }

    // Register a new user with verified IEC
    static async registerUser(userData) {
        const { user_id, iec_code, user_email, user_phone, verification_status } = userData;

        const [result] = await pool.execute(
            `INSERT INTO user_registrations 
            (user_id, iec_code, user_email, user_phone, verification_status) 
            VALUES (?, ?, ?, ?, ?)`,
            [user_id, iec_code, user_email, user_phone, verification_status || 'verified']
        );
        return result;
    }

    // Get user registration by user_id
    static async findUserByUserId(userId) {
        const [rows] = await pool.execute(
            `SELECT ur.*, ic.company_name, ic.address, ic.city, ic.state, ic.pincode, 
                    ic.country, ic.email as company_email, ic.phone as company_phone, ic.status
            FROM user_registrations ur
            JOIN iec_companies ic ON ur.iec_code = ic.iec_code
            WHERE ur.user_id = ?`,
            [userId]
        );
        return rows[0] || null;
    }

    // Check if user already exists
    static async checkUserExists(userId) {
        const [rows] = await pool.execute(
            'SELECT user_id FROM user_registrations WHERE user_id = ?',
            [userId]
        );
        return rows.length > 0;
    }

    // Check if email already exists
    static async checkUserEmailExists(email) {
        const [rows] = await pool.execute(
            'SELECT user_email FROM user_registrations WHERE user_email = ?',
            [email]
        );
        return rows.length > 0;
    }

    // Check if IEC code is already registered
    static async checkIECRegistered(iecCode) {
        const [rows] = await pool.execute(
            'SELECT iec_code FROM user_registrations WHERE iec_code = ?',
            [iecCode]
        );
        return rows.length > 0;
    }
}

module.exports = IECModel;
