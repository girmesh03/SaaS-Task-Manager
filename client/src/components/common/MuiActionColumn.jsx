/**
 * MuiActionColumn Component - Reusable Action Column for DataGrid
 *
 * Requirements: 15.9, 28.10, 34.1-34.8
 */

import { Box, IconButton, Tooltip, CircularProgress } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RestoreFromTrashIcon from "@mui/icons-material/RestoreFromTrash";
import { useAuthorization } from "../../hooks/useAuthorization";

const MuiActionColumn = ({
  row,
  resource, // Resource name for authorization checks (e.g., 'tasks', 'users')
  onView,
  onEdit,
  onDelete,
  onRestore,
  customActions = [],
  isLoading = false,
  loadingId = null, // ID of the row currently performing an action
}) => {
  const { canView, canEdit, canDelete, canRestore } = useAuthorization(resource);
  const isDeleted = row.isDeleted;
  const isRowLoading = isLoading && loadingId === row._id;

  if (isRowLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", gap: 0.5 }}>
      {/* View Action */}
      {onView && canView(row) && (
        <Tooltip title="View">
          <IconButton size="small" onClick={() => onView(row)} color="info">
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Edit Action */}
      {onEdit && canEdit(row) && !isDeleted && (
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => onEdit(row)} color="primary">
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Delete Action */}
      {onDelete && canDelete(row) && !isDeleted && (
        <Tooltip title="Delete">
          <IconButton size="small" onClick={() => onDelete(row)} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Restore Action */}
      {onRestore && canRestore && isDeleted && (
        <Tooltip title="Restore">
          <IconButton
            size="small"
            onClick={() => onRestore(row)}
            color="success"
          >
            <RestoreFromTrashIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Custom Actions */}
      {customActions.map((action, index) => {
        // Check if action should be shown
        if (action.show && !action.show(row)) return null;

        return (
          <Tooltip key={index} title={action.tooltip || ""}>
            <IconButton
              size="small"
              onClick={() => action.onClick(row)}
              color={action.color || "default"}
              disabled={action.disabled}
            >
              {action.icon}
            </IconButton>
          </Tooltip>
        );
      })}
    </Box>
  );
};

export default MuiActionColumn;
