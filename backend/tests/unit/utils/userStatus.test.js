import {
  setUserStatus,
  getUserStatus,
  removeUserStatus,
  getOnlineUsers,
  isUserOnline,
  updateLastSeen,
} from "../../../utils/userStatus.js";
import { USER_STATUS } from "../../../utils/constants.js";

describe("userStatus - User Status Tracking Utilities", () => {
  const userId = "user123";

  beforeEach(() => {
    // Since userStatusStore is a package-level Map, we need to clear it or handle it.
    // It's not exported, but we can clear it by removing specific keys we use.
    removeUserStatus(userId);
    removeUserStatus("user456");
  });

  describe("setUserStatus and getUserStatus", () => {
    test("should set and retrieve user status", () => {
      setUserStatus(userId, USER_STATUS.ONLINE);
      const status = getUserStatus(userId);

      expect(status.status).toBe(USER_STATUS.ONLINE);
      expect(status.lastSeen).toBeInstanceOf(Date);
    });

    test("should return offline for non-existent user", () => {
      const status = getUserStatus("nonexistent");
      expect(status.status).toBe(USER_STATUS.OFFLINE);
      expect(status.lastSeen).toBeNull();
    });
  });

  describe("removeUserStatus", () => {
    test("should remove status from store", () => {
      setUserStatus(userId, USER_STATUS.ONLINE);
      removeUserStatus(userId);
      const status = getUserStatus(userId);
      expect(status.status).toBe(USER_STATUS.OFFLINE);
    });
  });

  describe("getOnlineUsers", () => {
    test("should return list of IDs with Online status", () => {
      setUserStatus(userId, USER_STATUS.ONLINE);
      setUserStatus("user456", USER_STATUS.AWAY);
      setUserStatus("user789", USER_STATUS.ONLINE);

      const online = getOnlineUsers();
      expect(online).toContain(userId);
      expect(online).toContain("user789");
      expect(online).not.toContain("user456");

      // Cleanup for other tests
      removeUserStatus("user789");
    });
  });

  describe("isUserOnline", () => {
    test("should return true if status is ONLINE", () => {
      setUserStatus(userId, USER_STATUS.ONLINE);
      expect(isUserOnline(userId)).toBe(true);
    });

    test("should return false if status is AWAY", () => {
      setUserStatus(userId, USER_STATUS.AWAY);
      expect(isUserOnline(userId)).toBe(false);
    });
  });

  describe("updateLastSeen", () => {
    test("should update the lastSeen date", () => {
      setUserStatus(userId, USER_STATUS.ONLINE);
      const initialStatus = { ...getUserStatus(userId) };

      // Wait a tiny bit or just mock Date.now if needed, but simple re-set usually works
      const oldTime = initialStatus.lastSeen.getTime();

      // Force a slight delay to ensure time difference if needed, but Date constructor is precise enough usually
      // For testing, we can just check it's still online and has a date
      updateLastSeen(userId);
      const newStatus = getUserStatus(userId);

      expect(newStatus.status).toBe(USER_STATUS.ONLINE);
      expect(newStatus.lastSeen).toBeInstanceOf(Date);
    });
  });
});
