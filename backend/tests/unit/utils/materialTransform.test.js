import {
  transformMaterialForTask,
  transformMaterialsArray,
  calculateMaterialsCost,
  validateMaterialQuantities,
} from "../../../utils/materialTransform.js";

describe("materialTransform - Material Data Transformation Utilities", () => {
  const mockMaterial = {
    _id: "mat1",
    name: "Material 1",
    category: "Cat 1",
    unitType: "Unit",
    price: 10,
  };

  describe("transformMaterialForTask", () => {
    test("should transform material with quantity and total cost", () => {
      const result = transformMaterialForTask(mockMaterial, 5);
      expect(result).toEqual({
        _id: "mat1",
        name: "Material 1",
        category: "Cat 1",
        unitType: "Unit",
        price: 10,
        quantity: 5,
        totalCost: 50,
      });
    });
  });

  describe("transformMaterialsArray", () => {
    test("should transform array of materials", () => {
      const materials = [
        { material: mockMaterial, quantity: 2 },
        { material: { ...mockMaterial, _id: "mat2", price: 20 }, quantity: 1 },
      ];

      const result = transformMaterialsArray(materials);

      expect(result).toHaveLength(2);
      expect(result[0].totalCost).toBe(20);
      expect(result[1].totalCost).toBe(20);
    });

    test("should return original item if material index is not object (e.g. string ID)", () => {
      const materials = [{ material: "mat1", quantity: 2 }];
      const result = transformMaterialsArray(materials);
      expect(result).toEqual(materials);
    });
  });

  describe("calculateMaterialsCost", () => {
    test("should calculate total sum of material costs", () => {
      const materials = [
        { material: mockMaterial, quantity: 3 }, // 30
        { material: { ...mockMaterial, price: 5 }, quantity: 10 }, // 50
      ];

      const result = calculateMaterialsCost(materials);
      expect(result).toBe(80);
    });

    test("should return 0 for empty array", () => {
      expect(calculateMaterialsCost([])).toBe(0);
    });
  });

  describe("validateMaterialQuantities", () => {
    test("should return valid for positive quantities", () => {
      const materials = [{ quantity: 5 }, { quantity: 0 }];
      const result = validateMaterialQuantities(materials);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should return errors for negative quantities", () => {
      const materials = [{ quantity: 5 }, { quantity: -1 }];
      const result = validateMaterialQuantities(materials);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        index: 1,
        field: "quantity",
        message: "Quantity must be greater than or equal to 0",
      });
    });
  });
});
