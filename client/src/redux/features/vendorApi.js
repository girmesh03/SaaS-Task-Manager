/**
 * Vendor API - Vendor Management Endpoints
 *
 * RTK Query endpoints for vendor operations:
 * - Get Vendors: GET /api/vendors
 * - Get Vendor: GET /api/vendors/:vendorId
 * - Create Vendor: POST /api/vendors
 * - Update Vendor: PATCH /api/vendors/:vendorId
 * - Delete Vendor: DELETE /api/vendors/:vendorId
 * - Restore Vendor: PATCH /api/vendors/:vendorId/restore
 *
 * Requirements: 13.1 - 13.10
 */

import api from "./api";

/**
 * Vendor API slice
 *
 * Extends base API with vendor management endpoints.
 * Uses 'Vendor' tag for cache invalidation.
 */
export const vendorApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get vendors query
     *
     * GET /api/vendors
     *
     * Retrieves a list of vendors with pagination, filtering, and sorting.
     *
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (1-based)
     * @param {number} params.limit - Items per page
     * @param {string} params.search - Search term
     * @param {boolean} params.deleted - Filter by deleted status
     *
     * @returns {Object} Response with vendors array and pagination meta
     */
    getVendors: builder.query({
      query: (params) => ({
        url: "/vendors",
        method: "GET",
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({
                type: "Vendor",
                id: _id,
              })),
              { type: "Vendor", id: "LIST" },
            ]
          : [{ type: "Vendor", id: "LIST" }],
    }),

    /**
     * Get vendor query
     *
     * GET /api/vendors/:vendorId
     *
     * Retrieves a single vendor by ID.
     *
     * @param {string} vendorId - Vendor ID
     *
     * @returns {Object} Response with vendor object
     */
    getVendor: builder.query({
      query: (vendorId) => `/vendors/${vendorId}`,
      providesTags: (result, error, vendorId) => [{ type: "Vendor", id: vendorId }],
    }),

    /**
     * Create vendor mutation
     *
     * POST /api/vendors
     *
     * Creates a new vendor.
     *
     * @param {Object} data - Vendor data
     *
     * @returns {Object} Response with created vendor
     */
    createVendor: builder.mutation({
      query: (data) => ({
        url: "/vendors",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Vendor", id: "LIST" }],
    }),

    /**
     * Update vendor mutation
     *
     * PATCH /api/vendors/:vendorId
     *
     * Updates an existing vendor.
     *
     * @param {Object} args - Arguments
     * @param {string} args.vendorId - Vendor ID
     * @param {Object} args.data - Data to update
     *
     * @returns {Object} Response with updated vendor
     */
    updateVendor: builder.mutation({
      query: ({ vendorId, data }) => ({
        url: `/vendors/${vendorId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { vendorId }) => [
        { type: "Vendor", id: vendorId },
        { type: "Vendor", id: "LIST" },
      ],
    }),

    /**
     * Delete vendor mutation
     *
     * DELETE /api/vendors/:vendorId
     *
     * Soft deletes a vendor.
     *
     * @param {string} vendorId - Vendor ID
     *
     * @returns {Object} Response with success message
     */
    deleteVendor: builder.mutation({
      query: (vendorId) => ({
        url: `/vendors/${vendorId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, vendorId) => [
        { type: "Vendor", id: vendorId },
        { type: "Vendor", id: "LIST" },
      ],
    }),

    /**
     * Restore vendor mutation
     *
     * PATCH /api/vendors/:vendorId/restore
     *
     * Restores a soft-deleted vendor.
     *
     * @param {string} vendorId - Vendor ID
     *
     * @returns {Object} Response with restored vendor
     */
    restoreVendor: builder.mutation({
      query: (vendorId) => ({
        url: `/vendors/${vendorId}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, vendorId) => [
        { type: "Vendor", id: vendorId },
        { type: "Vendor", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetVendorsQuery,
  useGetVendorQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
  useRestoreVendorMutation,
} = vendorApi;
