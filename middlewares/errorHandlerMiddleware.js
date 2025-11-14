const errorHandlerMiddleware = async(err, req , res, next) => {

    console.error('Error occurred:', err);
    
    err.statusCode = err.statusCode || 500; 
    err.errMessage = err.message || err.errMessage || "Internal Server Error!"

    res.status(err.statusCode).json({
        success : false,
        message : err.errMessage
    });
};

module.exports = errorHandlerMiddleware;