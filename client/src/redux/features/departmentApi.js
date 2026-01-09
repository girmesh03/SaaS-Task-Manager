/**
 * Department API - Department Management Endpoints
 *
 * RTK Query endpoints for department operations:
 * - Get Departments: GET /api/departments
 * - Get Department: GET /api/departments/:departmentId
 * - Create Department: POST /api/departments
 * - Update Department: PATCH /api/departments/:departmentId
 * - Delete Department: DELETE /api/departments/:departmentId
 * - Restore Department: PATCH /api/departments/:departmentId/restore
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.9, 3.10
 */

import api from "./api";

/**
 * Department API slice
 *
 * Extends base API with department management endpoints.
 * Uses 'Department' tag for cache invalidation.
 */
export const departmentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get departments query
     *
     * GET /api/departments
     *
     * Retrieves a list of departments with pagination, filtering, and sorting.
     * Scoped to user's organization scope.
     *
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (1-based)
     * @param {number} params.limit - Items per page (default 10)
     * @param {string} params.search - Search term (name)
     * @param {string} params.sort - Sort field (default 'createdAt')
     * @param {string} params.order - Sort order ('asc' or 'desc')
     * @param {boolean} params.deleted - Filter by deleted status
     * @param {string} params.organizationId - Filter by organization (for Platform Admins)
     *
     * @returns {Object} Response with departments array and pagination meta
     */
    getDepartments: builder.query({
      query: (params) => ({
        url: "/departments",
        method: "GET",
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({
                type: "Department",
                id: _id,
              })),
              { type: "Department", id: "LIST" },
            ]
          : [{ type: "Department", id: "LIST" }],
    }),

    /**
     * Get department query
     *
     * GET /api/departments/:departmentId
     *
     * Retrieves a single department by ID.
     *
     * @param {string} departmentId - Department ID
     *
     * @returns {Object} Response with department object
     */
    getDepartment: builder.query({
      query: (departmentId) => `/departments/${departmentId}`,
      providesTags: (result, error, departmentId) => [{ type: "Department", id: departmentId }],
    }),

    /**
     * Create department mutation
     *
     * POST /api/departments
     *
     * Creates a new department.
     * HOD assignment is handled via update or separate logic/endpoints if not in body.
     *
     * @param {Object} data - Department data
     *
     * @returns {Object} Response with created department
     */
    createDepartment: builder.mutation({
      query: (data) => ({
        url: "/departments",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Department", id: "LIST" }],
    }),

    /**
     * Update department mutation
     *
     * PATCH /api/departments/:departmentId
     *
     * Updates an existing department.
     *
     * @param {Object} args - Arguments
     * @param {string} args.departmentId - Department ID
     * @param {Object} args.data - Data to update
     *
     * @returns {Object} Response with updated department
     */
    updateDepartment: builder.mutation({
      query: ({ departmentId, data }) => ({
        url: `/departments/${departmentId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { departmentId }) => [
        { type: "Department", id: departmentId },
        { type: "Department", id: "LIST" },
      ],
    }),

    /**
     * Delete department mutation
     *
     * DELETE /api/departments/:departmentId
     *
     * Soft deletes a department.
     *
     * @param {string} departmentId - Department ID
     *
     * @returns {Object} Response with success message
     */
    deleteDepartment: builder.mutation({
      query: (departmentId) => ({
        url: `/departments/${departmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, departmentId) => [
        { type: "Department", id: departmentId },
        { type: "Department", id: "LIST" },
      ],
    }),

    /**
     * Restore department mutation
     *
     * PATCH /api/departments/:departmentId/restore
     *
     * Restores a soft-deleted department.
     *
     * @param {string} departmentId - Department ID
     *
     * @returns {Object} Response with restored department
     */
    restoreDepartment: builder.mutation({
      query: (departmentId) => ({
        url: `/departments/${departmentId}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, departmentId) => [
        { type: "Department", id: departmentId },
        { type: "Department", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useGetDepartmentQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useRestoreDepartmentMutation,
} = departmentApi;
