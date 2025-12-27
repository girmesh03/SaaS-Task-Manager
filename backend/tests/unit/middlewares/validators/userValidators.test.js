import { jest } from "@jest/globals";
import mongoose from "mongoose";

const mockOrganization = {
  findById: jest.fn().mockReturnThis(),
  lean: jest.fn(),
};

const mockDepartment = {
  findById: jest.fn().mockReturnThis(),
  lean: jest.fn(),
};

const mockUser = {
  findOne: jest.fn().mockReturnThis(),
  findById: jest.fn().mockReturnThis(),
  withDeleted: jest.fn().mockReturnThis(),
  lean: jest.fn(),
};

jest.unstable_mockModule("../../../../models/Organization.js", () => ({ default: mockOrganization }));
jest.unstable_mockModule("../../../../models/Department.js", () => ({ default: mockDepartment }));
jest.unstable_mockModule("../../../../models/User.js", () => ({ default: mockUser }));

const { createUserValidator, updateUserValidator } = await import("../../../../middlewares/validators/userValidators.js");
const { USER_ROLES } = await import("../../../../utils/constants.js");

describe("userValidators", () => {
    let req, res, next;
    const orgId = new mongoose.Types.ObjectId();
    const deptId = new mongoose.Types.ObjectId();

    beforeEach(() => {
        req = {
            body: {},
            user: { organization: { _id: orgId }, role: USER_ROLES.PLATFORM_SUPER_ADMIN }
        };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        next = jest.fn();
        jest.clearAllMocks();
    });

    const runValidator = async (validator, data) => {
        req.body = data;
        try {
            for (const middleware of validator) {
                await new Promise((resolve, reject) => {
                    try {
                        middleware(req, res, (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    } catch (err) {
                        reject(err);
                    }
                });
            }
        } catch (error) {
            return error;
        }
    };

    describe("createUserValidator", () => {
        const validData = {
            firstName: "John",
            lastName: "Doe",
            email: "john@test.com",
            password: "password123",
            role: USER_ROLES.USER,
            organization: orgId.toString(),
            department: deptId.toString(),
            employeeId: "1001",
            joinedAt: new Date().toISOString()
        };

        test("should pass with valid data", async () => {
            mockOrganization.lean.mockResolvedValue({ _id: orgId });
            mockDepartment.lean.mockResolvedValue({ _id: deptId, organization: orgId });
            mockUser.lean.mockResolvedValue(null);

            const error = await runValidator(createUserValidator, validData);

            expect(error).toBeUndefined();
        });

        test("should fail if email exists (withDeleted)", async () => {
            mockOrganization.lean.mockResolvedValue({ _id: orgId });
            mockDepartment.lean.mockResolvedValue({ _id: deptId, organization: orgId });
            mockUser.lean.mockResolvedValue({ _id: "existing" });

            const error = await runValidator(createUserValidator, validData);

            expect(error).toBeDefined();
            expect(error.context.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ message: "Email already exists in this organization" })
                ])
            );
        });

        test("should fail with invalid role", async () => {
            const data = { ...validData, role: "InvalidRole" };
            const error = await runValidator(createUserValidator, data);
            expect(error).toBeDefined();
            expect(error.context.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ message: "Invalid user role" })
                ])
            );
        });

        test("should fail if department not found", async () => {
            mockOrganization.lean.mockResolvedValue({ _id: orgId });
            mockDepartment.lean.mockResolvedValue(null);

            const error = await runValidator(createUserValidator, validData);

            expect(error).toBeDefined();
            expect(error.context.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ message: "Department not found" })
                ])
            );
        });

        test("should fail if department belongs to another organization", async () => {
            mockOrganization.lean.mockResolvedValue({ _id: orgId });
            mockDepartment.lean.mockResolvedValue({ _id: deptId, organization: new mongoose.Types.ObjectId() });

            const error = await runValidator(createUserValidator, validData);

            expect(error).toBeDefined();
            expect(error.context.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ message: "Department must belong to the same organization" })
                ])
            );
        });
    });

    describe("updateUserValidator", () => {
        test("should pass with valid partial update", async () => {
            const data = { firstName: "Jane" };
            const error = await runValidator(updateUserValidator, data);
            expect(error).toBeUndefined();
        });

        test("should fail with invalid email format", async () => {
            const data = { email: "invalid" };
            const error = await runValidator(updateUserValidator, data);
            expect(error).toBeDefined();
            expect(error.context.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ message: "Invalid email format" })
                ])
            );
        });
    });
});
