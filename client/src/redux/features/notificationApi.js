/**
 * Notification API - Notification Management Endpoints
 *
 * RTK Query endpoints for notification operations:
 * - Get Notifications: GET /api/notifications
 * - Mark as Read: PATCH /api/notifications/:id/read
 * - Delete Notification: DELETE /api/notifications/:id
 *
 * Requirements: 13.1 - 13.10 (from tasks.md, requirements section may vary)
 */

import api from "./api";

/**
 * Notification API slice
 *
 * Extends base API with notification management endpoints.
 * Uses 'Notification' tag for cache invalidation.
 */
export const notificationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get notifications query
     *
     * GET /api/notifications
     *
     * Retrieves a list of notifictions for the current user.
     *
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (1-based)
     * @param {number} params.limit - Items per page
     * @param {boolean} params.unreadOnly - Filter by unread status
     *
     * @returns {Object} Response with notifications array and pagination meta
     */
    getNotifications: builder.query({
      query: (params) => ({
        url: "/notifications",
        method: "GET",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.notifications.map(({ _id }) => ({
                type: "Notification",
                id: _id,
              })),
              { type: "Notification", id: "LIST" },
            ]
          : [{ type: "Notification", id: "LIST" }],
    }),

    /**
     * Mark notification as read mutation
     *
     * PATCH /api/notifications/:id/read
     *
     * Marks a notification as read.
     *
     * @param {string} id - Notification ID
     *
     * @returns {Object} Response with updated notification
     */
    markNotificationAsRead: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Notification", id },
        { type: "Notification", id: "LIST" },
      ],
    }),

    /**
     * Mark all notifications as read mutation
     *
     * PATCH /api/notifications/read-all
     */
    markAllNotificationsAsRead: builder.mutation({
      query: () => ({
        url: "/notifications/read-all",
        method: "PATCH",
      }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),

    /**
     * Delete notification mutation
     *
     * DELETE /api/notifications/:id
     *
     * Permanently deletes a notification (soft delete not required usually for notifications).
     *
     * @param {string} id - Notification ID
     *
     * @returns {Object} Response with success message
     */
    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Notification", id },
        { type: "Notification", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
} = notificationApi;
