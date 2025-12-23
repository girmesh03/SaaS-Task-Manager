/**
 * Response Formatting Utilities
 *
 * Standardized response formats for API endpoints
 */

/**
 * Success response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {any} data - Response data
 * @param {object} meta - Additional metadata (pagination, etc.)
 */
export const successResponse = (
  res,
  statusCode,
  message,
  data = null,
  meta = null
) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  res.status(statusCode).json(response);
};

/**
 * Paginated response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {array} data - Array of items
 * @param {object} pagination - Pagination metadata
 */
export const paginatedResponse = (
  res,
  statusCode,
  message,
  data,
  pagination
) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination,
  });
};

/**
 * Created response (201)
 * @param {object} res - Express response object
 * @param {string} message - Success message
 * @param {any} data - Created resource data
 */
export const createdResponse = (res, message, data) => {
  successResponse(res, 201, message, data);
};

/**
 * OK response (200)
 * @param {object} res - Express response object
 * @param {string} message - Success message
 * @param {any} data - Response data
 */
export const okResponse = (res, message, data = null) => {
  successResponse(res, 200, message, data);
};

/**
 * No content response (204)
 * @param {object} res - Express response object
 */
export const noContentResponse = (res) => {
  res.status(204).send();
};
