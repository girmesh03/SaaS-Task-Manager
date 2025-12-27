import mongoose from "mongoose";
import softDeletePlugin from "../../../../models/plugins/softDelete.js";
import { jest } from "@jest/globals";

describe("softDeletePlugin", () => {
    let TestModel;
    let connection;

    beforeAll(async () => {
        // Use a real mongoose connection for testing plugin as middleware requires it
        // But since we are unit testing logic, we can also try mocking schema
        connection = await mongoose.createConnection(process.env.MONGODB_URI_TEST).asPromise();

        const testSchema = new mongoose.Schema({ name: String });
        testSchema.plugin(softDeletePlugin);
        TestModel = connection.model("SoftDeleteTest", testSchema);

        // Register User model for populate in getRestoreAudit
        if (!connection.models['User']) {
            connection.model('User', new mongoose.Schema({ firstName: String, lastName: String, email: String }));
        }
    });

    afterAll(async () => {
        await connection.dropCollection("softdeletetests").catch(() => {});
        await connection.close();
    });

    beforeEach(async () => {
        await TestModel.collection.deleteMany({});
    });

    test("should add soft delete fields to schema", () => {
        const schema = new mongoose.Schema({});
        schema.plugin(softDeletePlugin);
        expect(schema.path("isDeleted")).toBeDefined();
        expect(schema.path("deletedAt")).toBeDefined();
        expect(schema.path("deletedBy")).toBeDefined();
    });

    test("should automatically filter out deleted records", async () => {
        await TestModel.create({ name: "active" });
        const deleted = await TestModel.create({ name: "deleted" });

        // Manual update to bypass middleware for setup
        await TestModel.collection.updateOne(
            { _id: deleted._id },
            { $set: { isDeleted: true, deletedAt: new Date() } }
        );

        const found = await TestModel.find({});
        expect(found).toHaveLength(1);
        expect(found[0].name).toBe("active");

        const all = await TestModel.find({}).withDeleted();
        expect(all).toHaveLength(2);
    });

    test("should soft delete instance correctly", async () => {
        const doc = await TestModel.create({ name: "to delete" });
        const userId = new mongoose.Types.ObjectId();

        await doc.softDelete(userId);

        expect(doc.isDeleted).toBe(true);
        expect(doc.deletedBy).toEqual(userId);
        expect(doc.deletedAt).toBeInstanceOf(Date);

        const found = await TestModel.findById(doc._id);
        expect(found).toBeNull();
    });

    test("should restore instance correctly", async () => {
        const doc = await TestModel.create({ name: "to restore" });
        const userId = new mongoose.Types.ObjectId();
        await doc.softDelete(userId);

        const restoredUserId = new mongoose.Types.ObjectId();
        await doc.restore(restoredUserId);

        expect(doc.isDeleted).toBe(false);
        expect(doc.restoredBy).toEqual(restoredUserId);
        expect(doc.deletedAt).toBeNull();

        const found = await TestModel.findById(doc._id);
        expect(found).not.toBeNull();
    });

    test("should block hard delete operations", async () => {
        const doc = await TestModel.create({ name: "protection" });

        await expect(TestModel.deleteOne({ _id: doc._id })).rejects.toThrow("Hard delete operations are not allowed");
        await expect(TestModel.deleteMany({})).rejects.toThrow("Hard delete operations are not allowed");
    });

    test("should provide query helpers onlyDeleted", async () => {
        await TestModel.create({ name: "active" });
        const deleted = await TestModel.create({ name: "deleted" });
        await deleted.softDelete(new mongoose.Types.ObjectId());

        const onlyDeleted = await TestModel.find({}).onlyDeleted();
        expect(onlyDeleted).toHaveLength(1);
        expect(onlyDeleted[0].name).toBe("deleted");
    });

    test("should soft delete by ID correctly", async () => {
        const doc = await TestModel.create({ name: "by id" });
        const userId = new mongoose.Types.ObjectId();

        await TestModel.softDeleteById(doc._id, userId);

        const found = await TestModel.findById(doc._id).withDeleted();
        expect(found.isDeleted).toBe(true);
    });

    test("should soft delete many correctly", async () => {
        await TestModel.create({ name: "many1" });
        await TestModel.create({ name: "many2" });
        const userId = new mongoose.Types.ObjectId();

        const results = await TestModel.softDeleteMany({ name: /many/ }, userId);
        expect(results).toHaveLength(2);

        const count = await TestModel.collection.countDocuments({});
        const activeDocs = await TestModel.find({});
        expect(count).toBe(2);
        expect(activeDocs).toHaveLength(0);
    });

    test("should restore by ID correctly", async () => {
        const doc = await TestModel.create({ name: "restore by id" });
        const userId = new mongoose.Types.ObjectId();
        await doc.softDelete(userId);

        await TestModel.restoreById(doc._id, userId);

        const found = await TestModel.findById(doc._id);
        expect(found).not.toBeNull();
    });

    test("should restore many correctly", async () => {
        const doc1 = await TestModel.create({ name: "rmany1" });
        const doc2 = await TestModel.create({ name: "rmany2" });
        const userId = new mongoose.Types.ObjectId();
        await doc1.softDelete(userId);
        await doc2.softDelete(userId);

        const results = await TestModel.restoreMany({ name: /rmany/ }, userId);
        expect(results).toHaveLength(2);

        const count = await TestModel.countDocuments({});
        expect(count).toBe(2);
    });

    test("should find deleted by IDs", async () => {
        const doc1 = await TestModel.create({ name: "find1" });
        const doc2 = await TestModel.create({ name: "find2" });
        await doc1.softDelete(new mongoose.Types.ObjectId());

        const deleted = await TestModel.findDeletedByIds([doc1._id, doc2._id]);
        expect(deleted).toHaveLength(1);
        expect(deleted[0]._id).toEqual(doc1._id);
    });

    test("should count deleted correctly", async () => {
        await TestModel.create({ name: "count1" });
        const doc2 = await TestModel.create({ name: "count2" });
        await doc2.softDelete(new mongoose.Types.ObjectId());

        const count = await TestModel.countDeleted({});
        expect(count).toBe(1);
    });

    test("should ensure TTL index", async () => {
        await TestModel.ensureTTLIndex(100);
        await TestModel.ensureTTLIndex(null);
    });

    test("should get restore audit correctly", async () => {
        const doc = await TestModel.create({ name: "audit" });
        const userId = new mongoose.Types.ObjectId();
        await doc.softDelete(userId);
        await doc.restore(userId);

        const audit = await TestModel.getRestoreAudit(doc._id);
        expect(audit).not.toBeNull();
        expect(audit.isDeleted).toBe(false);
        expect(audit.deletedBy).toBeDefined();
        expect(audit.restoredBy).toBeDefined();
    });
});
