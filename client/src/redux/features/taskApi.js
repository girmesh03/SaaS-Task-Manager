/**
 * Task API - Task Management Endpoints
 *
 * RTK Query endpoints for task operations:
 * - Get Tasks: GET /api/tasks
 * - Get Task: GET /api/tasks/:id
 * - Create Task: POST /api/tasks
 * - Update Task: PATCH /api/tasks/:id
 * - Delete Task: DELETE /api/tasks/:id
 * - Restore Task: PATCH /api/tasks/:id/restore
 *
 * Requirements: 5.1 - 5.10
 */

import api from "./api";

/**
 * Task API slice
 *
 * Extends base API with task management endpoints.
 * Uses 'Task' tag for cache invalidation.
 */
export const taskApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get tasks query
     *
     * GET /api/tasks
     *
     * Retrieves a list of tasks with pagination, filtering, and sorting.
     * Scoped to user's permissions.
     *
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (1-based)
     * @param {number} params.limit - Items per page (default 10)
     * @param {string} params.search - Search term (title)
     * @param {string} params.sort - Sort field
     * @param {string} params.order - Sort order
     * @param {string} params.status - Filter by status
     * @param {string} params.priority - Filter by priority
     * @param {string} params.taskType - Filter by task type (ProjectTask, RoutineTask, AssignedTask)
     * @param {string} params.department - Filter by department
     * @param {string} params.assignedTo - Filter by assignee
     * @param {string} params.createdBy - Filter by creator
     * @param {boolean} params.isDeleted - Filter by deleted status
     *
     * @returns {Object} Response with tasks array and pagination meta
     */
    getTasks: builder.query({
      query: (params) => ({
        url: "/tasks",
        method: "GET",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.tasks.map(({ _id }) => ({
                type: "Task",
                id: _id,
              })),
              { type: "Task", id: "LIST" },
            ]
          : [{ type: "Task", id: "LIST" }],
    }),

    /**
     * Get task query
     *
     * GET /api/tasks/:id
     *
     * Retrieves a single task by ID.
     *
     * @param {string} id - Task ID
     *
     * @returns {Object} Response with task object
     */
    getTask: builder.query({
      query: (id) => `/tasks/${id}`,
      providesTags: (result, error, id) => [{ type: "Task", id }],
    }),

    /**
     * Create task mutation
     *
     * POST /api/tasks
     *
     * Creates a new task.
     * Supports polymorphism via 'taskType' field in body.
     *
     * @param {Object} data - Task data
     *
     * @returns {Object} Response with created task
     */
    createTask: builder.mutation({
      query: (data) => ({
        url: "/tasks",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Task", id: "LIST" }],
    }),

    /**
     * Update task mutation
     *
     * PATCH /api/tasks/:id
     *
     * Updates an existing task.
     *
     * @param {Object} args - Arguments
     * @param {string} args.id - Task ID
     * @param {Object} args.data - Data to update
     *
     * @returns {Object} Response with updated task
     */
    updateTask: builder.mutation({
      query: ({ id, data }) => ({
        url: `/tasks/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Task", id },
        { type: "Task", id: "LIST" },
      ],
    }),

    /**
     * Delete task mutation
     *
     * DELETE /api/tasks/:id
     *
     * Soft deletes a task.
     *
     * @param {string} id - Task ID
     *
     * @returns {Object} Response with success message
     */
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Task", id },
        { type: "Task", id: "LIST" },
      ],
    }),

    /**
     * Restore task mutation
     *
     * PATCH /api/tasks/:id/restore
     *
     * Restores a soft-deleted task.
     *
     * @param {string} id - Task ID
     *
     * @returns {Object} Response with restored task
     */
    restoreTask: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Task", id },
        { type: "Task", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useRestoreTaskMutation,
} = taskApi;
