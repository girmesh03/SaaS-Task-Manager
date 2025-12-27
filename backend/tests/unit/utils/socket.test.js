import { jest } from "@jest/globals";
import { SOCKET_EVENTS, USER_STATUS } from "../../../utils/constants.js";

// Mock socketInstance
const mockOn = jest.fn();
const mockUse = jest.fn();
const mockEmit = jest.fn();
const mockTo = jest.fn().mockReturnValue({ emit: mockEmit });
const mockIO = {
    on: mockOn,
    use: mockUse,
    to: mockTo
};

jest.unstable_mockModule("../../../utils/socketInstance.js", () => ({
  getIO: jest.fn().mockReturnValue(mockIO),
}));

// Mock userStatus
const mockSetUserStatus = jest.fn();
const mockRemoveUserStatus = jest.fn();
jest.unstable_mockModule("../../../utils/userStatus.js", () => ({
  setUserStatus: mockSetUserStatus,
  removeUserStatus: mockRemoveUserStatus,
}));

// Mock logger
const mockLogger = { info: jest.fn() };
jest.unstable_mockModule("../../../utils/logger.js", () => ({
  default: mockLogger,
}));

const { setupSocketHandlers } = await import("../../../utils/socket.js");

describe("socket utility - setupSocketHandlers", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should use auth middleware and setup connection handler", () => {
        setupSocketHandlers();
        expect(mockUse).toHaveBeenCalled();
        expect(mockOn).toHaveBeenCalledWith(SOCKET_EVENTS.CONNECTION, expect.any(Function));
    });

    test("should handle connection and join rooms", () => {
        setupSocketHandlers();
        const connectionHandler = mockOn.mock.calls.find(c => c[0] === SOCKET_EVENTS.CONNECTION)[1];

        const socket = {
            id: "socket123",
            handshake: {
                auth: {
                    user: {
                        _id: "user123",
                        department: { _id: "dept1" },
                        organization: { _id: "org1" }
                    }
                }
            },
            join: jest.fn(),
            on: jest.fn(),
            leave: jest.fn()
        };

        connectionHandler(socket);

        expect(socket.join).toHaveBeenCalledWith("user:user123");
        expect(socket.join).toHaveBeenCalledWith("department:dept1");
        expect(socket.join).toHaveBeenCalledWith("organization:org1");
        expect(mockSetUserStatus).toHaveBeenCalledWith("user123", USER_STATUS.ONLINE);
        expect(mockTo).toHaveBeenCalledWith("department:dept1");
        expect(mockEmit).toHaveBeenCalledWith(SOCKET_EVENTS.USER_ONLINE, expect.any(Object));
    });

    test("should handle disconnection", () => {
        setupSocketHandlers();
        const connectionHandler = mockOn.mock.calls.find(c => c[0] === SOCKET_EVENTS.CONNECTION)[1];

        const socket = {
            id: "socket123",
            handshake: {
                auth: {
                    user: {
                        _id: "user123",
                        department: { _id: "dept1" },
                        organization: { _id: "org1" }
                    }
                }
            },
            join: jest.fn(),
            on: jest.fn(),
            leave: jest.fn()
        };

        connectionHandler(socket);

        const disconnectHandler = socket.on.mock.calls.find(c => c[0] === SOCKET_EVENTS.DISCONNECT)[1];
        disconnectHandler();

        expect(mockSetUserStatus).toHaveBeenCalledWith("user123", USER_STATUS.OFFLINE);
        expect(mockTo).toHaveBeenCalledWith("department:dept1");
        expect(mockEmit).toHaveBeenCalledWith(SOCKET_EVENTS.USER_OFFLINE, expect.any(Object));
        expect(socket.leave).toHaveBeenCalledWith("user:user123");
        expect(socket.leave).toHaveBeenCalledWith("department:dept1");
        expect(socket.leave).toHaveBeenCalledWith("organization:org1");
    });
});
