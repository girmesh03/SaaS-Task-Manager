/**
 * Organization API - Organization Management Endpoints
 *
 * RTK Query endpoints for organization operations:
 * - Get Organizations: GET /api/organizations
 * - Get Organization: GET /api/organizations/:organizationId
 * - Create Organization: POST /api/organizations
 * - Update Organization: PATCH /api/organizations/:organizationId
 * - Delete Organization: DELETE /api/organizations/:organizationId
 * - Restore Organization: PATCH /api/organizations/:organizationId/restore
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.9, 2.10
 */

import api from "./api";

/**
 * Organization API slice
 *
 * Extends base API with organization management endpoints.
 * Uses 'Organization' tag for cache invalidation.
 */
export const organizationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get organizations query
     *
     * GET /api/organizations
     *
     * Retrieves a list of organizations with pagination, filtering, and sorting.
     * Platform SuperAdmins can view all organizations.
     *
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (1-based)
     * @param {number} params.limit - Items per page (default 10)
     * @param {string} params.search - Search term (name, email)
     * @param {string} params.sort - Sort field (default 'createdAt')
     * @param {string} params.order - Sort order ('asc' or 'desc')
     * @param {boolean} params.deleted - Filter by deleted status
     * @param {boolean} params.isPlatformOrg - Filter by platform org status
     *
     * @returns {Object} Response with organizations array and pagination meta
     */
    getOrganizations: builder.query({
      query: (params) => ({
        url: "/organizations",
        method: "GET",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.organizations.map(({ _id }) => ({
                type: "Organization",
                id: _id,
              })),
              { type: "Organization", id: "LIST" },
            ]
          : [{ type: "Organization", id: "LIST" }],
    }),

    /**
     * Get organization query
     *
     * GET /api/organizations/:organizationId
     *
     * Retrieves a single organization by ID.
     *
     * @param {string} organizationId - Organization ID
     *
     * @returns {Object} Response with organization object
     */
    getOrganization: builder.query({
      query: (organizationId) => `/organizations/${organizationId}`,
      providesTags: (result, error, organizationId) => [{ type: "Organization", id: organizationId }],
    }),

    /**
     * Create organization mutation
     *
     * POST /api/organizations
     *
     * Creates a new organization.
     * Note: Usually organizations are created via registration (authApi),
     * but Platform Admins might create them directly.
     *
     * @param {Object} data - Organization data
     *
     * @returns {Object} Response with created organization
     */
    createOrganization: builder.mutation({
      query: (data) => ({
        url: "/organizations",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Organization", id: "LIST" }],
    }),

    /**
     * Update organization mutation
     *
     * PATCH /api/organizations/:organizationId
     *
     * Updates an existing organization.
     *
     * @param {Object} args - Arguments
     * @param {string} args.organizationId - Organization ID
     * @param {Object} args.data - Data to update
     *
     * @returns {Object} Response with updated organization
     */
    updateOrganization: builder.mutation({
      query: ({ organizationId, data }) => ({
        url: `/organizations/${organizationId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { organizationId }) => [
        { type: "Organization", id: organizationId },
        { type: "Organization", id: "LIST" },
      ],
    }),

    /**
     * Delete organization mutation
     *
     * DELETE /api/organizations/:organizationId
     *
     * Soft deletes an organization.
     *
     * @param {string} organizationId - Organization ID
     *
     * @returns {Object} Response with success message
     */
    deleteOrganization: builder.mutation({
      query: (organizationId) => ({
        url: `/organizations/${organizationId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, organizationId) => [
        { type: "Organization", id: organizationId },
        { type: "Organization", id: "LIST" },
      ],
    }),

    /**
     * Restore organization mutation
     *
     * PATCH /api/organizations/:organizationId/restore
     *
     * Restores a soft-deleted organization.
     *
     * @param {string} organizationId - Organization ID
     *
     * @returns {Object} Response with restored organization
     */
    restoreOrganization: builder.mutation({
      query: (organizationId) => ({
        url: `/organizations/${organizationId}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, organizationId) => [
        { type: "Organization", id: organizationId },
        { type: "Organization", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetOrganizationsQuery,
  useGetOrganizationQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
  useRestoreOrganizationMutation,
} = organizationApi;
