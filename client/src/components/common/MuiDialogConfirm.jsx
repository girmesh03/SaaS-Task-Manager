/**
 * MuiDialogConfirm Component - Reusable Confirmation Dialog
 *
 * Requirements: 34.9
 */

import { Button, Typography } from "@mui/material";
import MuiDialog from "./MuiDialog";

const MuiDialogConfirm = ({
  open,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "primary",
  isLoading = false,
  ...muiProps
}) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const actions = (
    <>
      <Button onClick={onClose} color="inherit" disabled={isLoading}>
        {cancelText}
      </Button>
      <Button
        onClick={handleConfirm}
        color={confirmColor}
        variant="contained"
        disabled={isLoading}
        autoFocus
      >
        {isLoading ? "Processing..." : confirmText}
      </Button>
    </>
  );

  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      title={title}
      actions={actions}
      maxWidth="xs"
      {...muiProps}
    >
      <Typography variant="body1">{message}</Typography>
    </MuiDialog>
  );
};

export default MuiDialogConfirm;
