import { jest } from "@jest/globals";
import mongoose from "mongoose";

const mockOrganization = {
  findOne: jest.fn().mockReturnThis(),
  withDeleted: jest.fn().mockReturnThis(),
  lean: jest.fn(),
};

jest.unstable_mockModule("../../../../models/Organization.js", () => ({ default: mockOrganization }));

const { updateOrganizationValidator } = await import("../../../../middlewares/validators/organizationValidators.js");

describe("organizationValidators", () => {
    let req, res;
    const orgId = new mongoose.Types.ObjectId();

    beforeEach(() => {
        req = {
            body: {},
            params: { resourceId: orgId.toString() }
        };
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

    describe("updateOrganizationValidator", () => {
        test("should pass with valid update", async () => {
            const data = { name: "New Name" };
            mockOrganization.lean.mockResolvedValue(null);

            const error = await runValidator(updateOrganizationValidator, data);

            expect(error).toBeUndefined();
        });

        test("should fail if name exists on another organization", async () => {
            const data = { name: "Existing Name" };
            mockOrganization.lean.mockResolvedValue({ _id: new mongoose.Types.ObjectId(), name: "Existing Name" });

            const error = await runValidator(updateOrganizationValidator, data);

            expect(error).toBeDefined();
            expect(error.context.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ message: "Organization name already exists" })
                ])
            );
        });
    });
});
