/**
 * Task Activity API - Task Activity Management Endpoints
 *
 * RTK Query endpoints for task activity operations:
 * - Get Activities: GET /api/activities
 * - Get Activity: GET /api/activities/:activityId
 * - Create Activity: POST /api/activities
 * - Update Activity: PATCH /api/activities/:activityId
 * - Delete Activity: DELETE /api/activities/:activityId
 * - Restore Activity: PATCH /api/activities/:activityId/restore
 *
 * Requirements: 8.1 - 8.10
 */

import api from "./api";

/**
 * Task Activity API slice
 *
 * Extends base API with task activity management endpoints.
 * Uses 'TaskActivity' tag for cache invalidation.
 */
export const taskActivityApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get task activities query
     *
     * GET /api/activities
     *
     * Retrieves a list of task activities filtered by task.
     *
     * @param {Object} params - Query parameters
     * @param {string} params.taskId - Parent Task ID
     * @param {number} params.page - Page number (1-based)
     * @param {number} params.limit - Items per page
     * @param {string} params.sort - Sort field
     * @param {string} params.order - Sort order
     * @param {boolean} params.deleted - Filter by deleted status
     *
     * @returns {Object} Response with activities array and pagination meta
     */
    getTaskActivities: builder.query({
      query: (params) => {
        const { task, ...rest } = params;
        return {
          url: "/activities",
          method: "GET",
          params: { ...rest, taskId: task },
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.activities.map(({ _id }) => ({
                type: "TaskActivity",
                id: _id,
              })),
              { type: "TaskActivity", id: "LIST" },
            ]
          : [{ type: "TaskActivity", id: "LIST" }],
    }),

    /**
     * Get task activity query
     *
     * GET /api/activities/:id
     *
     * Retrieves a single task activity by ID.
     *
     * @param {string} activityId - Task Activity ID
     *
     * @returns {Object} Response with activity object
     */
    getTaskActivity: builder.query({
      query: (activityId) => `/activities/${activityId}`,
      providesTags: (result, error, activityId) => [{ type: "TaskActivity", id: activityId }],
    }),

    /**
     * Create task activity mutation
     *
     * POST /api/activities
     *
     * Creates a new task activity.
     *
     * @param {Object} data - Activity data
     *
     * @returns {Object} Response with created activity
     */
    createTaskActivity: builder.mutation({
      query: (data) => ({
        url: "/activities",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [
        { type: "TaskActivity", id: "LIST" },
        { type: "Task", id: "LIST" }, // Passively update task list (e.g. counts) if needed
      ],
    }),

    /**
     * Update task activity mutation
     *
     * PATCH /api/activities/:activityId
     *
     * Updates an existing task activity.
     *
     * @param {Object} args - Arguments
     * @param {string} args.activityId - Activity ID
     * @param {Object} args.data - Data to update
     *
     * @returns {Object} Response with updated activity
     */
    updateTaskActivity: builder.mutation({
      query: ({ activityId, data }) => ({
        url: `/activities/${activityId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { activityId }) => [
        { type: "TaskActivity", id: activityId },
        { type: "TaskActivity", id: "LIST" },
      ],
    }),

    /**
     * Delete task activity mutation
     *
     * DELETE /api/activities/:activityId
     *
     * Soft deletes a task activity.
     *
     * @param {string} activityId - Activity ID
     *
     * @returns {Object} Response with success message
     */
    deleteTaskActivity: builder.mutation({
      query: (activityId) => ({
        url: `/activities/${activityId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, activityId) => [
        { type: "TaskActivity", id: activityId },
        { type: "TaskActivity", id: "LIST" },
      ],
    }),

    /**
     * Restore task activity mutation
     *
     * PATCH /api/activities/:activityId/restore
     *
     * Restores a soft-deleted task activity.
     *
     * @param {string} activityId - Activity ID
     *
     * @returns {Object} Response with restored activity
     */
    restoreTaskActivity: builder.mutation({
      query: (activityId) => ({
        url: `/activities/${activityId}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, activityId) => [
        { type: "TaskActivity", id: activityId },
        { type: "TaskActivity", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetTaskActivitiesQuery,
  useGetTaskActivityQuery,
  useCreateTaskActivityMutation,
  useUpdateTaskActivityMutation,
  useDeleteTaskActivityMutation,
  useRestoreTaskActivityMutation,
} = taskActivityApi;
