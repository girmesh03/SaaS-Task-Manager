/**
 * MuiCard Component - Reusable Card
 *
 * Requirements from Task 7.6
 */

import { forwardRef } from "react";
import {
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
} from "@mui/material";

const MuiCard = forwardRef(
  (
    {
      title,
      subheader,
      avatar,
      action,
      image,
      imageHeight = 140,
      imageAlt,
      children, // Content
      actions, // Footer actions
      sx,
      headerSx,
      contentSx,
      actionsSx,
      ...muiProps
    },
    ref
  ) => {
    return (
      <Card ref={ref} sx={sx} {...muiProps}>
        {(title || subheader || avatar || action) && (
          <CardHeader
            avatar={avatar}
            action={action}
            title={title}
            subheader={subheader}
            sx={headerSx}
          />
        )}
        {image && (
          <CardMedia
            component="img"
            height={imageHeight}
            image={image}
            alt={imageAlt || title}
          />
        )}
        <CardContent sx={contentSx}>{children}</CardContent>
        {actions && <CardActions sx={actionsSx}>{actions}</CardActions>}
      </Card>
    );
  }
);

MuiCard.displayName = "MuiCard";

export default MuiCard;
