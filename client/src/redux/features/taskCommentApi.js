/**
 * Task Comment API - Task Comment Management Endpoints
 *
 * RTK Query endpoints for task comment operations:
 * - Get Comments: GET /api/comments
 * - Get Comment: GET /api/comments/:commentId
 * - Create Comment: POST /api/comments
 * - Update Comment: PATCH /api/comments/:commentId
 * - Delete Comment: DELETE /api/comments/:commentId
 * - Restore Comment: PATCH /api/comments/:commentId/restore
 *
 * Requirements: 9.1 - 9.10
 */

import api from "./api";

/**
 * Task Comment API slice
 *
 * Extends base API with task comment management endpoints.
 * Uses 'TaskComment' tag for cache invalidation.
 */
export const taskCommentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get task comments query
     *
     * GET /api/comments
     *
     * Retrieves a list of comments filtered by parent (Task or TaskActivity).
     *
     * @param {Object} params - Query parameters
     * @param {string} params.taskId - Task ID to get all comments (including nested)
     * @param {string} params.task - Parent Task ID (for root comments only)
     * @param {string} params.activity - Parent Activity ID (optional)
     * @param {number} params.page - Page number (1-based)
     * @param {number} params.limit - Items per page
     * @param {string} params.sort - Sort field
     * @param {string} params.order - Sort order
     * @param {boolean} params.deleted - Filter by deleted status
     *
     * @returns {Object} Response with comments array and pagination meta
     */
    getTaskComments: builder.query({
      query: (params) => {
        const { task, activity, taskId, ...rest } = params;
        return {
          url: "/comments",
          method: "GET",
          params: {
            ...rest,
            taskId: taskId,
            parentId: !taskId ? task || activity : undefined,
          },
        };
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({
                type: "TaskComment",
                id: _id,
              })),
              { type: "TaskComment", id: "LIST" },
            ]
          : [{ type: "TaskComment", id: "LIST" }],
    }),

    /**
     * Get task comment query
     *
     * GET /api/comments/:commentId
     *
     * Retrieves a single task comment by ID.
     *
     * @param {string} commentId - Comment ID
     *
     * @returns {Object} Response with comment object
     */
    getTaskComment: builder.query({
      query: (commentId) => `/comments/${commentId}`,
      providesTags: (result, error, commentId) => [
        { type: "TaskComment", id: commentId },
      ],
    }),

    /**
     * Create task comment mutation
     *
     * POST /api/comments
     *
     * Creates a new task comment.
     *
     * @param {Object} data - Comment data
     *
     * @returns {Object} Response with created comment
     */
    createTaskComment: builder.mutation({
      query: (data) => ({
        url: "/comments",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [
        { type: "TaskComment", id: "LIST" },
        { type: "Task", id: "LIST" }, // Passively update task
        { type: "TaskActivity", id: "LIST" }, // Passively update activity
      ],
    }),

    /**
     * Update task comment mutation
     *
     * PATCH /api/comments/:commentId
     *
     * Updates an existing task comment (own comments only).
     *
     * @param {Object} args - Arguments
     * @param {string} args.commentId - Comment ID
     * @param {Object} args.data - Data to update
     *
     * @returns {Object} Response with updated comment
     */
    updateTaskComment: builder.mutation({
      query: ({ commentId, data }) => ({
        url: `/comments/${commentId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { commentId }) => [
        { type: "TaskComment", id: commentId },
        { type: "TaskComment", id: "LIST" },
      ],
    }),

    /**
     * Delete task comment mutation
     *
     * DELETE /api/comments/:commentId
     *
     * Soft deletes a task comment.
     *
     * @param {string} commentId - Comment ID
     *
     * @returns {Object} Response with success message
     */
    deleteTaskComment: builder.mutation({
      query: (commentId) => ({
        url: `/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, commentId) => [
        { type: "TaskComment", id: commentId },
        { type: "TaskComment", id: "LIST" },
      ],
    }),

    /**
     * Restore task comment mutation
     *
     * PATCH /api/comments/:commentId/restore
     *
     * Restores a soft-deleted task comment.
     *
     * @param {string} commentId - Comment ID
     *
     * @returns {Object} Response with restored comment
     */
    restoreTaskComment: builder.mutation({
      query: (commentId) => ({
        url: `/comments/${commentId}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, commentId) => [
        { type: "TaskComment", id: commentId },
        { type: "TaskComment", id: "LIST" },
      ],
    }),

    /**
     * Toggle like on comment mutation
     *
     * POST /api/comments/:commentId/like
     *
     * Toggles like status for the current user on a comment.
     *
     * @param {string} commentId - Comment ID
     *
     * @returns {Object} Response with updated comment and like status
     */
    toggleLikeComment: builder.mutation({
      query: (commentId) => ({
        url: `/comments/${commentId}/like`,
        method: "POST",
      }),
      invalidatesTags: (result, error, commentId) => [
        { type: "TaskComment", id: commentId },
        { type: "TaskComment", id: "LIST" },
      ],
    }),

    /**
     * Get comment likes query
     *
     * GET /api/comments/:commentId/likes
     *
     * Retrieves list of users who liked the comment.
     *
     * @param {string} commentId - Comment ID
     *
     * @returns {Object} Response with likes array and count
     */
    getCommentLikes: builder.query({
      query: (commentId) => `/comments/${commentId}/likes`,
      providesTags: (result, error, commentId) => [
        { type: "TaskComment", id: commentId },
      ],
    }),
  }),
});

export const {
  useGetTaskCommentsQuery,
  useGetTaskCommentQuery,
  useCreateTaskCommentMutation,
  useUpdateTaskCommentMutation,
  useDeleteTaskCommentMutation,
  useRestoreTaskCommentMutation,
  useToggleLikeCommentMutation,
  useGetCommentLikesQuery,
} = taskCommentApi;
