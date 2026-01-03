/**
 * MuiStepper Component - Reusable Stepper
 *
 * Requirements from Task 7.6
 */

import { forwardRef } from "react";
import {
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Box,
  Button,
} from "@mui/material";

const MuiStepper = forwardRef(
  (
    {
      activeStep = 0,
      steps = [], // Array of { label, description, content }
      orientation = "horizontal",
      alternativeLabel = false,
      nonLinear = false,
      onStepClick,
      sx,
      ...muiProps
    },
    ref
  ) => {
    return (
      <Stepper
        ref={ref}
        activeStep={activeStep}
        orientation={orientation}
        alternativeLabel={alternativeLabel}
        nonLinear={nonLinear}
        sx={sx}
        {...muiProps}
      >
        {steps.map((step, index) => (
          <Step key={step.label} completed={step.completed}>
            <StepLabel
              error={step.error}
              optional={step.optional}
              onClick={
                onStepClick || nonLinear ? () => onStepClick?.(index) : undefined
              }
              sx={{
                cursor: onStepClick || nonLinear ? "pointer" : "default",
              }}
            >
              {step.label}
            </StepLabel>
            {orientation === "vertical" && (
              <StepContent>
                {step.description && <Box sx={{ mb: 2 }}>{step.description}</Box>}
                {step.content}
              </StepContent>
            )}
          </Step>
        ))}
      </Stepper>
    );
  }
);

MuiStepper.displayName = "MuiStepper";

export default MuiStepper;
