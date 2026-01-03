/**
 * Material API - Material Management Endpoints
 *
 * RTK Query endpoints for material operations:
 * - Get Materials: GET /api/materials
 * - Get Material: GET /api/materials/:id
 * - Create Material: POST /api/materials
 * - Update Material: PATCH /api/materials/:id
 * - Delete Material: DELETE /api/materials/:id
 * - Restore Material: PATCH /api/materials/:id/restore
 *
 * Requirements: 12.1 - 12.10
 */

import api from "./api";

/**
 * Material API slice
 *
 * Extends base API with material management endpoints.
 * Uses 'Material' tag for cache invalidation.
 */
export const materialApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get materials query
     *
     * GET /api/materials
     *
     * Retrieves a list of materials with pagination, filtering, and sorting.
     *
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (1-based)
     * @param {number} params.limit - Items per page
     * @param {string} params.search - Search term
     * @param {string} params.category - Filter by category
     * @param {string} params.status - Filter by status
     * @param {boolean} params.isDeleted - Filter by deleted status
     *
     * @returns {Object} Response with materials array and pagination meta
     */
    getMaterials: builder.query({
      query: (params) => ({
        url: "/materials",
        method: "GET",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.materials.map(({ _id }) => ({
                type: "Material",
                id: _id,
              })),
              { type: "Material", id: "LIST" },
            ]
          : [{ type: "Material", id: "LIST" }],
    }),

    /**
     * Get material query
     *
     * GET /api/materials/:id
     *
     * Retrieves a single material by ID.
     *
     * @param {string} id - Material ID
     *
     * @returns {Object} Response with material object
     */
    getMaterial: builder.query({
      query: (id) => `/materials/${id}`,
      providesTags: (result, error, id) => [{ type: "Material", id }],
    }),

    /**
     * Create material mutation
     *
     * POST /api/materials
     *
     * Creates a new material.
     *
     * @param {Object} data - Material data
     *
     * @returns {Object} Response with created material
     */
    createMaterial: builder.mutation({
      query: (data) => ({
        url: "/materials",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Material", id: "LIST" }],
    }),

    /**
     * Update material mutation
     *
     * PATCH /api/materials/:id
     *
     * Updates an existing material.
     *
     * @param {Object} args - Arguments
     * @param {string} args.id - Material ID
     * @param {Object} args.data - Data to update
     *
     * @returns {Object} Response with updated material
     */
    updateMaterial: builder.mutation({
      query: ({ id, data }) => ({
        url: `/materials/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Material", id },
        { type: "Material", id: "LIST" },
      ],
    }),

    /**
     * Delete material mutation
     *
     * DELETE /api/materials/:id
     *
     * Soft deletes a material.
     *
     * @param {string} id - Material ID
     *
     * @returns {Object} Response with success message
     */
    deleteMaterial: builder.mutation({
      query: (id) => ({
        url: `/materials/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Material", id },
        { type: "Material", id: "LIST" },
      ],
    }),

    /**
     * Restore material mutation
     *
     * PATCH /api/materials/:id/restore
     *
     * Restores a soft-deleted material.
     *
     * @param {string} id - Material ID
     *
     * @returns {Object} Response with restored material
     */
    restoreMaterial: builder.mutation({
      query: (id) => ({
        url: `/materials/${id}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Material", id },
        { type: "Material", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetMaterialsQuery,
  useGetMaterialQuery,
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
  useDeleteMaterialMutation,
  useRestoreMaterialMutation,
} = materialApi;
