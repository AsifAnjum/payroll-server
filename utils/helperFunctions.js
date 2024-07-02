const mongoose = require("mongoose");

/**
 * @param {any} res - The response object.
 * @param {200 | 201 | 204 | 400 | 401 | 403 | 404 | 500 } httpStatusCode  - The HTTP status code.
 *   - `200`: OK - The request was successful.
 *   - `201`: Created - The request resulted in a new resource being successfully created.
 *   - `204`: No Content - The server successfully processed the request but there is no content to send.
 *   - `400`: Bad Request - The request cannot be fulfilled due to bad syntax or other client-side error.
 *   - `401`: Unauthorized - Similar to 403, but specifically for authentication purposes.
 *   - `403`: Forbidden - The server understood the request, but it refuses to authorize it.
 *   - `404`: Not Found - The requested resource could not be found on the server.
 *   - `500`: Internal Server Error - A generic error message returned when an unexpected condition was encountered on the server.
 * @param {'success' | 'failed'} status - Either 'success' or 'failed'.
 * @param {string | null} message - The message.
 * @param {string | object | null} error - The error, if any.
 * @param {string | object | null} data - The data.
 * @returns {Object} - The response object.
 */

exports.response = (
  res,
  httpStatusCode,
  status,
  message = null,
  error = null,
  data = null
) => {
  const responseObj = { status };

  // if (message) {
  //   if (status == "failed" && error.name === "StrictModeError") {
  //     responseObj.message = `${error.path} is not in schema`;
  //   } else {
  //     responseObj.message = message;
  //   }
  // }

  if (message) {
    responseObj.message = message;
  }

  if (error) {
    if (
      error instanceof mongoose.Error.ValidationError ||
      mongoose.Error.CastError
    ) {
      let customFieldErrors;

      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        customFieldErrors = [
          {
            [field]: `${field} is already exists!!!`,
          },
        ];
      }
      // else if (error.name === "StrictModeError") {
      //   customFieldErrors = { message: `${error.path} is not in schema` };
      // }
      else if (error.name === "CastError") {
        customFieldErrors = { [error.path]: error.message };
      } else {
        customFieldErrors = error?.errors
          ? Object.keys(error.errors).map((field) => ({
              [field]: error.errors[field].message,
            }))
          : error;
        // customFieldErrors = error?.errors
        //   ? Object.keys(error.errors).map((field) => ({
        //       [field]: error.errors[field].message,
        //     }))
        //   : (responseObj.error = error);
      }

      responseObj.error = customFieldErrors;
    } else {
      responseObj.error = error;
    }
  }

  if (data) {
    responseObj.data = data;
  }

  return res.status(httpStatusCode).json(responseObj);
};

/**
 * @param {object} obj- this params take only object
 * @returns {true | false} - The response Boolean
 *
 */

exports.isObjEmpty = (obj) => Object.keys(obj).length === 0;

/**
 * @param {string} str - string only
 * @param {string} prodId - ObjectId only
 * @returns {string} - return string
 */
exports.customSlug = (str, prodId) => {
  let slug = str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]+/g, "")
    .replace(/-+/g, "-");
  if (slug.length > 60) {
    slug = slug.substring(0, 60);
  }
  // const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  // `${slug}-${Date.now()}`
  const suffix = Date.now().toString(36);

  return `${slug}-${suffix}-${prodId}`;
};

/**
 * @param {array} arr - array only
 * @param {object} obj - obj only
 * @returns {true | false} - the response is Boolean
 */
exports.restrictField = (arr, obj) => {
  return Object.keys(obj).some((field) => arr.includes(field));
};
