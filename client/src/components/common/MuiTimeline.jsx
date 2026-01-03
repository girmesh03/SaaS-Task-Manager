/**
 * MuiTimeline Component - Reusable Timeline
 *
 * Requirements from Task 7.6
 */

import { forwardRef } from "react";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from "@mui/lab";

const MuiTimeline = forwardRef(
  (
    {
      items = [], // Array of { id, content, oppositeContent, dotColor, dotVariant, icon }
      position = "right", // left | right | alternate | alternate-reverse
      sx,
      ...muiProps
    },
    ref
  ) => {
    return (
      <Timeline ref={ref} position={position} sx={sx} {...muiProps}>
        {items.map((item, index) => (
          <TimelineItem key={item.id || index}>
             {/* Only render OppositeContent if provided or if position allows space for it */}
            {(item.oppositeContent) && (
              <TimelineOppositeContent color="text.secondary">
                {item.oppositeContent}
              </TimelineOppositeContent>
            )}

            <TimelineSeparator>
              <TimelineDot
                color={item.dotColor || "primary"}
                variant={item.dotVariant || "filled"}
              >
                {item.icon}
              </TimelineDot>
              {index < items.length - 1 && <TimelineConnector />}
            </TimelineSeparator>

            <TimelineContent>{item.content}</TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    );
  }
);

MuiTimeline.displayName = "MuiTimeline";

export default MuiTimeline;
