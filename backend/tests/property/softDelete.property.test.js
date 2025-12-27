import mongoose from "mongoose";
import fc from "fast-check";
import softDeletePlugin from "../../models/plugins/softDelete.js";

describe("Soft Delete Plugin Property-Based Tests", () => {
    let TestModel;
    let connection;

    beforeAll(async () => {
        connection = await mongoose.createConnection(process.env.MONGODB_URI_TEST).asPromise();
        const testSchema = new mongoose.Schema({
            name: String,
            organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }
        });
        testSchema.plugin(softDeletePlugin);
        TestModel = connection.model("SoftDeletePropertyTest", testSchema);
    });

    afterAll(async () => {
        await connection.dropCollection("softdeletepropertytests").catch(() => {});
        await connection.close();
    });

    beforeEach(async () => {
        await TestModel.collection.deleteMany({});
    });

    /**
     * **Feature: saas-task-manager-mvp, Property 17: Soft Delete Exclusion**
     * **Validates: Requirements 7.3**
     */
    test("Property 17: results without withDeleted() should always have isDeleted: false", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(fc.record({ name: fc.string(), isDeleted: fc.boolean() }), { minLength: 1, maxLength: 20 }),
                async (docsData) => {
                    await TestModel.collection.deleteMany({});

                    // Direct insert to bypass middleware for setup
                    await TestModel.collection.insertMany(docsData.map(d => ({ ...d, _id: new mongoose.Types.ObjectId() })));

                    const found = await TestModel.find({});
                    found.forEach(doc => {
                        expect(doc.isDeleted).toBe(false);
                    });
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * **Feature: saas-task-manager-mvp, Property 19: Soft Delete Field Setting**
     * **Validates: Requirements 7.1**
     */
    test("Property 19: softDelete() should set all required audit fields", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string(),
                fc.uint8Array({ minLength: 12, maxLength: 12 }), // For ObjectId
                async (name, userIdBuffer) => {
                    const doc = await TestModel.create({ name });
                    const userId = new mongoose.Types.ObjectId(userIdBuffer);

                    await doc.softDelete(userId);

                    expect(doc.isDeleted).toBe(true);
                    expect(doc.deletedAt).toBeInstanceOf(Date);
                    expect(doc.deletedBy).toEqual(userId);
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * **Feature: saas-task-manager-mvp, Property 20: Restore Field Setting**
     * **Validates: Requirements 7.5**
     */
    test("Property 20: restore() should set all required audit fields", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string(),
                fc.uint8Array({ minLength: 12, maxLength: 12 }), // For userId
                async (name, userIdBuffer) => {
                    const doc = await TestModel.create({ name });
                    const userId = new mongoose.Types.ObjectId(userIdBuffer);
                    await doc.softDelete(userId);

                    await doc.restore(userId);

                    expect(doc.isDeleted).toBe(false);
                    expect(doc.restoredAt).toBeInstanceOf(Date);
                    expect(doc.restoredBy).toEqual(userId);
                    expect(doc.deletedAt).toBeNull();
                    expect(doc.deletedBy).toBeNull();
                }
            ),
            { numRuns: 50 }
        );
    });
});
