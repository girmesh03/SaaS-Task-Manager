import { jest } from "@jest/globals";
import fc from "fast-check";

const mockOrganization = {
  findOne: jest.fn().mockReturnThis(),
  withDeleted: jest.fn().mockReturnThis(),
  lean: jest.fn(),
};

jest.unstable_mockModule("../../models/Organization.js", () => ({
  default: mockOrganization,
}));

const { registerValidator } = await import("../../middlewares/validators/authValidators.js");

describe("Validators Property-Based Tests", () => {
    let req, res;

    beforeEach(() => {
        req = { body: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
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

    test("Property 12: Uniqueness Check with Soft Delete (Organization Name)", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.boolean(), // isDeleted
                async (name, isDeleted) => {
                    jest.clearAllMocks();
                    // Mock finding an existing organization (potentially soft-deleted)
                    mockOrganization.lean.mockResolvedValue({ name, isDeleted });

                    const data = {
                        organization: { name, email: "test@org.com", phone: "0911223344" },
                        department: { name: "Dept" },
                        user: { firstName: "A", lastName: "B", email: "a@b.com", password: "p", employeeId: "1000", joinedAt: new Date().toISOString() }
                    };

                    const error = await runValidator(registerValidator, data);

                    // Validator should fail because name already exists (even if deleted)
                    expect(error).toBeDefined();
                    expect(error.context.errors).toEqual(
                        expect.arrayContaining([
                            expect.objectContaining({ message: "Organization name already exists" })
                        ])
                    );
                    expect(mockOrganization.withDeleted).toHaveBeenCalled();
                }
            ),
            { numRuns: 50 }
        );
    });
});
