/**
 * MuiDialog Component - Reusable Dialog wrapper
 *
 * Requirements: 15.10, 30.9
 */

import { forwardRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useMediaQuery,
  useTheme,
  Slide,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

// Transition component for dialogs
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const MuiDialog = forwardRef(
  (
    {
      open,
      onClose,
      title,
      children,
      actions,
      maxWidth = "sm",
      fullWidth = true,
      fullScreen: forceFullScreen,
      showCloseButton = true,
      TransitionComponent = Transition,
      ...muiProps
    },
    ref
  ) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const fullScreen = forceFullScreen !== undefined ? forceFullScreen : isMobile;

    return (
      <Dialog
        ref={ref}
        open={open}
        onClose={onClose}
        fullWidth={fullWidth}
        maxWidth={maxWidth}
        fullScreen={fullScreen}
        slots={{ transition: TransitionComponent }}
        {...muiProps}
      >
        {title && (
          <DialogTitle sx={{ m: 0, p: 2, pr: 6 }}>
            {title}
            {showCloseButton && onClose && (
              <IconButton
                aria-label="close"
                onClick={onClose}
                sx={{
                  position: "absolute",
                  right: 8,
                  top: 8,
                  color: (theme) => theme.palette.grey[500],
                }}
              >
                <CloseIcon />
              </IconButton>
            )}
          </DialogTitle>
        )}
        <DialogContent dividers>{children}</DialogContent>
        {actions && <DialogActions>{actions}</DialogActions>}
      </Dialog>
    );
  }
);

MuiDialog.displayName = "MuiDialog";

export default MuiDialog;
