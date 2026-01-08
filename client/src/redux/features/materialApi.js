/**
 * Material API - Material Management Endpoints
 *
 * RTK Query endpoints for material operations:
 * - Get Materials: GET /api/materials
 * - Get Material: GET /api/materials/:materialId
 * - Create Material: POST /api/materials
 * - Update Material: PATCH /api/materials/:materialId
 * - Delete Material: DELETE /api/materials/:materialId
 * - Restore Material: PATCH /api/materials/:materialId/restore
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
     * @param {string} params.departmentId - Filter by department
     * @param {boolean} params.deleted - Filter by deleted status
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
     * @param {string} materialId - Material ID
     *
     * @returns {Object} Response with material object
     */
    getMaterial: builder.query({
      query: (materialId) => `/materials/${materialId}`,
      providesTags: (result, error, materialId) => [{ type: "Material", id: materialId }],
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
     * PATCH /api/materials/:materialId
     *
     * Updates an existing material.
     *
     * @param {Object} args - Arguments
     * @param {string} args.materialId - Material ID
     * @param {Object} args.data - Data to update
     *
     * @returns {Object} Response with updated material
     */
    updateMaterial: builder.mutation({
      query: ({ materialId, data }) => ({
        url: `/materials/${materialId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { materialId }) => [
        { type: "Material", id: materialId },
        { type: "Material", id: "LIST" },
      ],
    }),

    /**
     * Delete material mutation
     *
     * DELETE /api/materials/:materialId
     *
     * Soft deletes a material.
     *
     * @param {string} materialId - Material ID
     *
     * @returns {Object} Response with success message
     */
    deleteMaterial: builder.mutation({
      query: (materialId) => ({
        url: `/materials/${materialId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, materialId) => [
        { type: "Material", id: materialId },
        { type: "Material", id: "LIST" },
      ],
    }),

    /**
     * Restore material mutation
     *
     * PATCH /api/materials/:materialId/restore
     *
     * Restores a soft-deleted material.
     *
     * @param {string} materialId - Material ID
     *
     * @returns {Object} Response with restored material
     */
    restoreMaterial: builder.mutation({
      query: (materialId) => ({
        url: `/materials/${materialId}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, materialId) => [
        { type: "Material", id: materialId },
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
