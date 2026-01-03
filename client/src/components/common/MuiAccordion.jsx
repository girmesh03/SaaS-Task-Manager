/**
 * MuiAccordion Component - Reusable Accordion
 *
 * Requirements from Task 7.6
 */

import { forwardRef } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const MuiAccordion = forwardRef(
  (
    {
      items = [], // Array of { id, title, content, disabled }
      exclusive = false, // If true, only one can be open at a time
      expanded, // Controlled expanded state (string | false) for exclusive, or (string[]) for multiple
      onChange,
      defaultExpanded = [],
      ...muiProps
    },
    ref
  ) => {
    return (
      <div ref={ref}>
        {items.map((item) => (
          <Accordion
            key={item.id}
            expanded={
              exclusive
                ? expanded === item.id
                : Array.isArray(expanded)
                ? expanded.includes(item.id)
                : undefined
            }
            defaultExpanded={
              !expanded && defaultExpanded.includes(item.id)
            }
            onChange={(event, isExpanded) => {
              if (onChange) {
                onChange(event, isExpanded, item.id);
              }
            }}
            disabled={item.disabled}
            {...muiProps}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`${item.id}-content`}
              id={`${item.id}-header`}
            >
              <Typography>{item.title}</Typography>
            </AccordionSummary>
            <AccordionDetails>{item.content}</AccordionDetails>
          </Accordion>
        ))}
      </div>
    );
  }
);

MuiAccordion.displayName = "MuiAccordion";

export default MuiAccordion;
