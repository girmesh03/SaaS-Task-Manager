import { validationResult, matchedData } from "express-validator";
import CustomError from "../../errorHandler/CustomError.js";

/**
 * Middleware to handle validation errors from express-validator
 * Extracts validated data and stores in req.validated
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    throw CustomError.validation("Validation failed", {
      errors: errorMessages,
    });
  }

  // Store validated data in req.validated for use in controllers
  req.validated = {
    body: matchedData(req, { locations: ["body"] }),
    params: matchedData(req, { locations: ["params"] }),
    query: matchedData(req, { locations: ["query"] }),
  };

  next();
};
