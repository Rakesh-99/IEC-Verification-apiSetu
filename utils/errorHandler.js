class ErrorHandler extends Error{ 
    constructor(statusCode , errMessage) { 
        super(errMessage);
        this.statusCode = statusCode
    };
};

module.exports = ErrorHandler;