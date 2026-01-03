import React from "react";
import { useForm } from "react-hook-form";
import { Box, Button, Typography, Paper, Stack } from "@mui/material";

import {
  MuiTextField,
  MuiTextArea,
  MuiNumberField,
  MuiSelectAutocomplete,
  MuiMultiSelect,
  MuiDatePicker,
  MuiDateRangePicker,
  MuiCheckbox,
  MuiRadioGroup,
  MuiSwitch,
  MuiSlider,
  MuiRating,
} from "./components/common";

// Start Icon for test
import EmailIcon from "@mui/icons-material/Email";

// End Icon for test
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const App = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      // Text Input Components
      textArea: "",
      numberField: "",
      // Select Components
      singleSelect: null,
      multiSelect: [],
      // Date Components
      datePicker: null,
      dateRange: { start: null, end: null },
      // Input Components
      checkbox: false,
      radioGroup: "",
      switch: false,
      slider: 50,
      rating: 0,
    },
  });

  const onSubmit = (data) => {
    console.log("Form Data:", data);
    alert("Form submitted! Check console for data.");
  };

  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Form Components Test
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Manual testing all 12 reusable form components
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}></form>
      </Paper>
    </Box>
  );
};

export default App;
