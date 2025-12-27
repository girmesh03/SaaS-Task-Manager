import { jest } from "@jest/globals";
import mongoose from "mongoose";

const mockDepartment = {
  findById: jest.fn().mockReturnThis(),
  lean: jest.fn(),
};

const mockVendor = {
  findById: jest.fn().mockReturnThis(),
  lean: jest.fn(),
};

const mockUser = {
  find: jest.fn().mockReturnThis(),
  lean: jest.fn(),
};

jest.unstable_mockModule("../../../../models/Department.js", () => ({ default: mockDepartment }));
jest.unstable_mockModule("../../../../models/Vendor.js", () => ({ default: mockVendor }));
jest.unstable_mockModule("../../../../models/User.js", () => ({ default: mockUser }));

const { createTaskValidator, updateTaskValidator, taskIdValidator } = await import("../../../../middlewares/validators/taskValidators.js");
const { TASK_TYPES, TASK_STATUS, TASK_PRIORITY } = await import("../../../../utils/constants.js");

describe("taskValidators", () => {
    let req, res, next;
    const orgId = new mongoose.Types.ObjectId();
    const deptId = new mongoose.Types.ObjectId();
    const vendorId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    beforeEach(() => {
        req = {
            body: {},
            user: { organization: { _id: orgId } }
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

    describe("createTaskValidator", () => {
        test("should pass for valid ProjectTask", async () => {
            const data = {
                description: "New Task",
                taskType: TASK_TYPES.PROJECT_TASK,
                department: deptId.toString(),
                startDate: new Date().toISOString(),
                dueDate: new Date().toISOString(),
                vendor: vendorId.toString()
            };

            mockDepartment.lean.mockResolvedValue({ _id: deptId, organization: orgId, isDeleted: false });
            mockVendor.lean.mockResolvedValue({ _id: vendorId, organization: orgId, isDeleted: false });

            const error = await runValidator(createTaskValidator, data);

            expect(error).toBeUndefined();
        });

        test("should fail if department belongs to another organization", async () => {
            const data = {
                description: "New Task",
                taskType: TASK_TYPES.PROJECT_TASK,
                department: deptId.toString(),
                startDate: new Date().toISOString(),
                dueDate: new Date().toISOString(),
                vendor: vendorId.toString()
            };

            mockDepartment.lean.mockResolvedValue({ _id: deptId, organization: new mongoose.Types.ObjectId(), isDeleted: false });
            mockVendor.lean.mockResolvedValue({ _id: vendorId, organization: orgId, isDeleted: false });

            const error = await runValidator(createTaskValidator, data);

            expect(error).toBeDefined();
            expect(error.context.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ message: "Department must belong to the same organization" })
                ])
            );
        });

        test("should fail if RoutineTask has invalid priority", async () => {
            const data = {
                description: "Routine",
                taskType: TASK_TYPES.ROUTINE_TASK,
                department: deptId.toString(),
                startDate: new Date().toISOString(),
                dueDate: new Date().toISOString(),
                priority: TASK_PRIORITY.HIGH
            };

            mockDepartment.lean.mockResolvedValue({ _id: deptId, organization: orgId, isDeleted: false });

            const error = await runValidator(createTaskValidator, data);

            expect(error).toBeDefined();
            expect(error.context.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ message: "RoutineTask priority must be 'Medium'" })
                ])
            );
        });

        test("should fail if vendor belongs to another organization", async () => {
            const data = {
                description: "New Task",
                taskType: TASK_TYPES.PROJECT_TASK,
                department: deptId.toString(),
                startDate: new Date().toISOString(),
                dueDate: new Date().toISOString(),
                vendor: vendorId.toString()
            };

            mockDepartment.lean.mockResolvedValue({ _id: deptId, organization: orgId, isDeleted: false });
            mockVendor.lean.mockResolvedValue({ _id: vendorId, organization: new mongoose.Types.ObjectId(), isDeleted: false });

            const error = await runValidator(createTaskValidator, data);

            expect(error).toBeDefined();
            expect(error.context.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ message: "Vendor must belong to the same organization" })
                ])
            );
        });

        test("should fail if RoutineTask has invalid status", async () => {
            const data = {
                description: "Routine",
                taskType: TASK_TYPES.ROUTINE_TASK,
                department: deptId.toString(),
                startDate: new Date().toISOString(),
                dueDate: new Date().toISOString(),
                status: TASK_STATUS.IN_PROGRESS
            };

            mockDepartment.lean.mockResolvedValue({ _id: deptId, organization: orgId, isDeleted: false });

            const error = await runValidator(createTaskValidator, data);

            expect(error).toBeDefined();
            expect(error.context.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ message: "RoutineTask can only be 'To Do' or 'Completed'" })
                ])
            );
        });

        test("should fail if AssignedTask has too many assignees", async () => {
            const data = {
                description: "Assigned",
                taskType: TASK_TYPES.ASSIGNED_TASK,
                department: deptId.toString(),
                assignees: Array(31).fill(userId.toString())
            };

            mockDepartment.lean.mockResolvedValue({ _id: deptId, organization: orgId, isDeleted: false });

            const error = await runValidator(createTaskValidator, data);

            expect(error).toBeDefined();
            expect(error.context.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ message: expect.stringContaining("Cannot have more than") })
                ])
            );
        });

        test("should fail if assignee belongs to another organization", async () => {
            const data = {
                description: "Assigned",
                taskType: TASK_TYPES.ASSIGNED_TASK,
                department: deptId.toString(),
                assignees: [userId.toString()]
            };

            mockDepartment.lean.mockResolvedValue({ _id: deptId, organization: orgId, isDeleted: false });
            mockUser.lean.mockResolvedValue([{ _id: userId, organization: new mongoose.Types.ObjectId(), isDeleted: false }]);

            const error = await runValidator(createTaskValidator, data);

            expect(error).toBeDefined();
            expect(error.context.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ message: "All assignees must belong to the same organization" })
                ])
            );
        });

        test("should fail if tags exceed limit", async () => {
             const data = {
                description: "Task",
                taskType: TASK_TYPES.ROUTINE_TASK,
                department: deptId.toString(),
                startDate: new Date().toISOString(),
                dueDate: new Date().toISOString(),
                tags: Array(11).fill("tag")
            };

            mockDepartment.lean.mockResolvedValue({ _id: deptId, organization: orgId, isDeleted: false });

            const error = await runValidator(createTaskValidator, data);

            expect(error).toBeDefined();
            expect(error.context.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ message: expect.stringContaining("Cannot have more than") })
                ])
            );
        });

        test("should fail if AssignedTask has no assignees", async () => {
            const data = {
                description: "Assigned",
                taskType: TASK_TYPES.ASSIGNED_TASK,
                department: deptId.toString(),
                assignees: []
            };

            mockDepartment.lean.mockResolvedValue({ _id: deptId, organization: orgId, isDeleted: false });

            const error = await runValidator(createTaskValidator, data);

            expect(error).toBeDefined();
            expect(error.context.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ message: "At least one assignee required for AssignedTask" })
                ])
            );
        });
    });

    describe("updateTaskValidator", () => {
        test("should pass with partial update", async () => {
            const data = { description: "Updated" };
            const error = await runValidator(updateTaskValidator, data);
            expect(error).toBeUndefined();
        });

        test("should fail with invalid vendor ID", async () => {
            const data = { vendor: "invalid" };
            const error = await runValidator(updateTaskValidator, data);
            expect(error).toBeDefined();
            expect(error.context.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ message: "Invalid vendor ID" })
                ])
            );
        });
    });

    describe("taskIdValidator", () => {
        test("should fail with invalid mongo id", async () => {
            req.params = { resourceId: "invalid" };
            const error = await runValidator(taskIdValidator, {});
            expect(error).toBeDefined();
            expect(error.context.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ message: "Invalid task ID" })
                ])
            );
        });
    });
});
