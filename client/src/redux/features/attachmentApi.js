/**
 * Attachment API - Attachment Management Endpoints
 *
 * RTK Query endpoints for attachment operations:
 * - Get Attachments: GET /api/attachments
 * - Get Attachment: GET /api/attachments/:attachmentId
 * - Upload Attachment: POST /api/attachments/upload
 * - Delete Attachment: DELETE /api/attachments/:attachmentId
 * - Restore Attachment: PATCH /api/attachments/:attachmentId/restore
 *
 * Requirements: 12.1 - 12.10 (from tasks.md, actual requirements section in page-spec may differ)
 */

import api from "./api";

/**
 * Attachment API slice
 *
 * Extends base API with attachment management endpoints.
 * Uses 'Attachment' tag for cache invalidation.
 */
export const attachmentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get attachments query
     *
     * GET /api/attachments
     *
     * Retrieves a list of attachments filtered by parent.
     *
     * @param {Object} params - Query parameters
     * @param {string} params.parentId - Parent ID (User, Task, Comment, etc)
     * @param {string} params.parentModel - Parent Model Name
     * @param {number} params.page - Page number (1-based)
     * @param {number} params.limit - Items per page
     * @param {string} params.sort - Sort field
     * @param {string} params.order - Sort order
     * @param {boolean} params.deleted - Filter by deleted status
     *
     * @returns {Object} Response with attachments array and pagination meta
     */
    getAttachments: builder.query({
      query: (params) => {
        const { parent, ...rest } = params;
        return {
          url: "/attachments",
          method: "GET",
          params: { ...rest, parentId: parent },
        };
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({
                type: "Attachment",
                id: _id,
              })),
              { type: "Attachment", id: "LIST" },
            ]
          : [{ type: "Attachment", id: "LIST" }],
    }),

    /**
     * Get attachment query
     *
     * GET /api/attachments/:attachmentId
     *
     * Retrieves a single attachment by ID.
     *
     * @param {string} attachmentId - Attachment ID
     *
     * @returns {Object} Response with attachment object
     */
    getAttachment: builder.query({
      query: (attachmentId) => `/attachments/${attachmentId}`,
      providesTags: (result, error, attachmentId) => [{ type: "Attachment", id: attachmentId }],
    }),

    /**
     * Upload attachment mutation
     *
     * POST /api/attachments/upload
     *
     * Uploads a new attachment file (handles multipart/form-data).
     *
     * @param {FormData} formData - Multipart form data with 'file' field
     *
     * @returns {Object} Response with created attachment
     */
    uploadAttachment: builder.mutation({
      query: (formData) => ({
        url: "/attachments/upload",
        method: "POST",
        body: formData,
        // FormData is automatically handled by fetchBaseQuery to set correct Content-Type (boundary)
      }),
      invalidatesTags: [{ type: "Attachment", id: "LIST" }],
    }),

    // Note: If you have a separate route for creating the attachment record AFTER upload, add it.
    // Usually /upload handles both upload and record creation in this architecture.

    /**
     * Delete attachment mutation
     *
     * DELETE /api/attachments/:attachmentId
     *
     * Soft deletes an attachment.
     *
     * @param {string} attachmentId - Attachment ID
     *
     * @returns {Object} Response with success message
     */
    deleteAttachment: builder.mutation({
      query: (attachmentId) => ({
        url: `/attachments/${attachmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, attachmentId) => [
        { type: "Attachment", id: attachmentId },
        { type: "Attachment", id: "LIST" },
      ],
    }),

    /**
     * Restore attachment mutation
     *
     * PATCH /api/attachments/:attachmentId/restore
     *
     * Restores a soft-deleted attachment.
     *
     * @param {string} attachmentId - Attachment ID
     *
     * @returns {Object} Response with restored attachment
     */
    restoreAttachment: builder.mutation({
      query: (attachmentId) => ({
        url: `/attachments/${attachmentId}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, attachmentId) => [
        { type: "Attachment", id: attachmentId },
        { type: "Attachment", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetAttachmentsQuery,
  useGetAttachmentQuery,
  useUploadAttachmentMutation,
  useDeleteAttachmentMutation,
  useRestoreAttachmentMutation,
} = attachmentApi;
