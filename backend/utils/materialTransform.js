/**
 * Material Data Transformation Utilities
 *
 * Transform material data for different contexts
 */

/**
 * Transform material for task/activity display
 * @param {object} material - Material document
 * @param {number} quantity - Quantity used
 * @returns {object} Transformed material data
 */
export const transformMaterialForTask = (material, quantity) => {
  return {
    _id: material._id,
    name: material.name,
    category: material.category,
    unitType: material.unitType,
    price: material.price,
    quantity,
    totalCost: material.price * quantity,
  };
};

/**
 * Transform materials array for task/activity
 * @param {array} materials - Array of {material, quantity}
 * @returns {array} Transformed materials array
 */
export const transformMaterialsArray = (materials) => {
  return materials.map((item) => {
    if (item.material && typeof item.material === "object") {
      return transformMaterialForTask(item.material, item.quantity);
    }
    return item;
  });
};

/**
 * Calculate total cost of materials
 * @param {array} materials - Array of {material, quantity}
 * @returns {number} Total cost
 */
export const calculateMaterialsCost = (materials) => {
  return materials.reduce((total, item) => {
    if (item.material && typeof item.material === "object") {
      return total + item.material.price * item.quantity;
    }
    return total;
  }, 0);
};

/**
 * Validate material quantities
 * @param {array} materials - Array of {material, quantity}
 * @returns {object} { valid: boolean, errors: array }
 */
export const validateMaterialQuantities = (materials) => {
  const errors = [];

  materials.forEach((item, index) => {
    if (item.quantity < 0) {
      errors.push({
        index,
        field: "quantity",
        message: "Quantity must be greater than or equal to 0",
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};
