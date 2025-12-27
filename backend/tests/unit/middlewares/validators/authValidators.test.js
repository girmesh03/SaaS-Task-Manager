import { jest } from "@jest/globals";

const mockOrganization = {
  findOne: jest.fn().mockReturnThis(),
  withDeleted: jest.fn().mockReturnThis(),
  lean: jest.fn(),
};

const mockUser = {
    findOne: jest.fn().mockReturnThis(),
    withDeleted: jest.fn().mockReturnThis(),
    lean: jest.fn(),
};

jest.unstable_mockModule("../../../../models/Organization.js", () => ({
  default: mockOrganization,
}));

jest.unstable_mockModule("../../../../models/User.js", () => ({
  default: mockUser,
}));

const { registerValidator, loginValidator } = await import("../../../../middlewares/validators/authValidators.js");

describe("authValidators", () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {},
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
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

    describe("registerValidator", () => {
        const validData = {
            organization: {
                name: "Test Org",
                email: "org@test.com",
                phone: "0911223344"
            },
            department: {
                name: "Test Dept"
            },
            user: {
                firstName: "John",
                lastName: "Doe",
                email: "john@test.com",
                password: "password123",
                employeeId: "1234",
                joinedAt: new Date().toISOString()
            }
        };

        test("should pass with valid data", async () => {
            mockOrganization.lean.mockResolvedValue(null);

            const error = await runValidator(registerValidator, validData);

            expect(error).toBeUndefined();
        });

        test("should fail if organization email exists (withDeleted)", async () => {
            mockOrganization.lean.mockResolvedValue({ _id: "org1" });

            const error = await runValidator(registerValidator, validData);

            expect(error).toBeDefined();
            expect(error.statusCode).toBe(400);
            expect(error.errorCode).toBe("VALIDATION_ERROR");
            expect(error.context.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ message: "Organization email already exists" })
                ])
            );
        });

        test("should fail with invalid email/phone format", async () => {
            const invalidData = {
                ...validData,
                organization: { ...validData.organization, email: "invalid", phone: "123" }
            };

            const error = await runValidator(registerValidator, invalidData);

            expect(error).toBeDefined();
            expect(error.context.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ message: "Invalid organization email format" }),
                    expect.objectContaining({ message: "Invalid phone format. Use +251XXXXXXXXX or 0XXXXXXXXX" })
                ])
            );
        });

        test("should fail if employeeId is not 4 digits", async () => {
            const invalidData = {
                ...validData,
                user: { ...validData.user, employeeId: "12" }
            };

            const error = await runValidator(registerValidator, invalidData);
            expect(error).toBeDefined();
            expect(error.context.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ message: "Employee ID must be a 4-digit number between 1000-9999" })
                ])
            );
        });
    });

    describe("loginValidator", () => {
        test("should fail with missing email/password", async () => {
            const error = await runValidator(loginValidator, { email: "", password: "" });
            expect(error).toBeDefined();
            expect(error.context.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ message: "Email is required" }),
                    expect.objectContaining({ message: "Password is required" })
                ])
            );
        });
    });
});
