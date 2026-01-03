/**
 * Vendor API - Vendor Management Endpoints
 *
 * RTK Query endpoints for vendor operations:
 * - Get Vendors: GET /api/vendors
 * - Get Vendor: GET /api/vendors/:id
 * - Create Vendor: POST /api/vendors
 * - Update Vendor: PATCH /api/vendors/:id
 * - Delete Vendor: DELETE /api/vendors/:id
 * - Restore Vendor: PATCH /api/vendors/:id/restore
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
     * @param {boolean} params.isDeleted - Filter by deleted status
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
        result
          ? [
              ...result.data.vendors.map(({ _id }) => ({
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
     * GET /api/vendors/:id
     *
     * Retrieves a single vendor by ID.
     *
     * @param {string} id - Vendor ID
     *
     * @returns {Object} Response with vendor object
     */
    getVendor: builder.query({
      query: (id) => `/vendors/${id}`,
      providesTags: (result, error, id) => [{ type: "Vendor", id }],
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
     * PATCH /api/vendors/:id
     *
     * Updates an existing vendor.
     *
     * @param {Object} args - Arguments
     * @param {string} args.id - Vendor ID
     * @param {Object} args.data - Data to update
     *
     * @returns {Object} Response with updated vendor
     */
    updateVendor: builder.mutation({
      query: ({ id, data }) => ({
        url: `/vendors/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Vendor", id },
        { type: "Vendor", id: "LIST" },
      ],
    }),

    /**
     * Delete vendor mutation
     *
     * DELETE /api/vendors/:id
     *
     * Soft deletes a vendor.
     *
     * @param {string} id - Vendor ID
     *
     * @returns {Object} Response with success message
     */
    deleteVendor: builder.mutation({
      query: (id) => ({
        url: `/vendors/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Vendor", id },
        { type: "Vendor", id: "LIST" },
      ],
    }),

    /**
     * Restore vendor mutation
     *
     * PATCH /api/vendors/:id/restore
     *
     * Restores a soft-deleted vendor.
     *
     * @param {string} id - Vendor ID
     *
     * @returns {Object} Response with restored vendor
     */
    restoreVendor: builder.mutation({
      query: (id) => ({
        url: `/vendors/${id}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Vendor", id },
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
