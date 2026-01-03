/**
 * MuiTabs Component - Reusable Tabs
 *
 * Requirements from Task 7.6
 */

import { forwardRef } from "react";
import { Tabs, Tab, Box } from "@mui/material";

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

const MuiTabs = forwardRef(
  (
    {
      value,
      onChange,
      tabs = [], // Array of { label, content, icon, disabled }
      variant = "standard",
      centered = false,
      scrollButtons = "auto",
      allowScrollButtonsMobile = true,
      textColor = "primary",
      indicatorColor = "primary",
      ariaLabel = "tabs",
      sx,
      panelSx,
      ...muiProps
    },
    ref
  ) => {
    return (
      <Box sx={{ width: "100%" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            ref={ref}
            value={value}
            onChange={onChange}
            variant={variant}
            centered={centered}
            scrollButtons={scrollButtons}
            allowScrollButtonsMobile={allowScrollButtonsMobile}
            textColor={textColor}
            indicatorColor={indicatorColor}
            aria-label={ariaLabel}
            sx={sx}
            {...muiProps}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                icon={tab.icon}
                disabled={tab.disabled}
                iconPosition="start"
                {...a11yProps(index)}
              />
            ))}
          </Tabs>
        </Box>
        {tabs.map((tab, index) => (
          <div
            key={index}
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
          >
            {value === index && (
              <Box sx={{ p: 3, ...panelSx }}>{tab.content}</Box>
            )}
          </div>
        ))}
      </Box>
    );
  }
);

MuiTabs.displayName = "MuiTabs";

export default MuiTabs;
