import { jest } from "@jest/globals";
import {
  successResponse,
  paginatedResponse,
  createdResponse,
  okResponse,
  noContentResponse,
} from "../../../utils/responseTransform.js";

describe("responseTransform - Response Formatting Utilities", () => {
  let res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  describe("successResponse", () => {
    test("should send success response with status code and message", () => {
      successResponse(res, 200, "Success");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Success",
      });
    });

    test("should include data if provided", () => {
      const data = { id: 1 };
      successResponse(res, 200, "Success", data);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Success",
        data,
      });
    });

    test("should include meta if provided", () => {
      const meta = { total: 10 };
      successResponse(res, 200, "Success", null, meta);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Success",
        meta,
      });
    });
  });

  describe("paginatedResponse", () => {
    test("should send paginated response structure", () => {
      const data = [{ id: 1 }];
      const pagination = { page: 1, total: 1 };
      paginatedResponse(res, 200, "Success", data, pagination);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Success",
        data,
        pagination,
      });
    });
  });

  describe("createdResponse", () => {
    test("should call successResponse with status 201", () => {
      const data = { id: 1 };
      createdResponse(res, "Created", data);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: "Created",
        data,
      }));
    });
  });

  describe("okResponse", () => {
    test("should call successResponse with status 200", () => {
      const data = { id: 1 };
      okResponse(res, "OK", data);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: "OK",
        data,
      }));
    });
  });

  describe("noContentResponse", () => {
    test("should send 204 status with no body", () => {
      noContentResponse(res);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
