import { useForm, Controller } from "react-hook-form";
import { Box, Button, Typography, Paper, Stack, Divider } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";

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

// Mock data for select components
const departmentOptions = [
  { _id: "1", name: "Engineering" },
  { _id: "2", name: "Marketing" },
  { _id: "3", name: "Sales" },
  { _id: "4", name: "HR" },
];

const userOptions = [
  { _id: "1", fullName: "John Doe" },
  { _id: "2", fullName: "Jane Smith" },
  { _id: "3", fullName: "Bob Johnson" },
  { _id: "4", fullName: "Alice Williams" },
];

const priorityOptions = [
  { label: "Low", value: "Low" },
  { label: "Medium", value: "Medium" },
  { label: "High", value: "High" },
  { label: "Urgent", value: "Urgent" },
];

const App = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      // Text Input Components
      firstName: "",
      email: "",
      password: "",
      description: "",
      quantity: "",
      price: "",
      // Select Components
      department: null,
      assignees: [],
      // Date Components
      startDate: null,
      dateRange: { start: null, end: null },
      // Input Components
      rememberMe: false,
      priority: "",
      emailNotifications: false,
      percentage: 50,
      rating: 0,
    },
  });

  // Watch values removed as per user request to avoid performance issues
  // Components should use Controller for controlled state


  const onSubmit = (data) => {
    console.log("Form Data:", data);
    alert("Form submitted! Check console for data.");
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Form Components Test - Updated with Spread Register Pattern
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {/* All components now use {...register()} spread pattern with error, */}
        helperText, onChange, onBlur, and ...muiProps
      </Typography>
      <Typography
        variant="caption"
        color="success.main"
        gutterBottom
        display="block"
      >
        ✅ No PropTypes for components with displayName
      </Typography>
      <Typography
        variant="caption"
        color="success.main"
        gutterBottom
        display="block"
      >
        ✅ TextField supports startAdornment and endAdornment
      </Typography>
      <Typography
        variant="caption"
        color="success.main"
        gutterBottom
        display="block"
      >
        ✅ TextArea has character counter
      </Typography>
      <Typography
        variant="caption"
        color="success.main"
        gutterBottom
        display="block"
      >
        ✅ Rating supports readOnly prop
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            {/* Section 1: Text Input Components */}
            <Box>
              <Typography variant="h6" gutterBottom>
                1. Text Input Components (with adornments)
              </Typography>
              <Stack spacing={2}>
                <MuiTextField
                  {...register("firstName", {
                    required: "First name is required",
                    maxLength: { value: 20, message: "Max 20 characters" },
                  })}
                  error={errors.firstName}
                  label="First Name"
                  type="text"
                  fullWidth
                  size="small"
                  margin="normal"
                  autoComplete="given-name"
                  placeholder="Enter your first name"
                />

                <MuiTextField
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Invalid email format",
                    },
                  })}
                  error={errors.email}
                  label="Email"
                  type="email"
                  fullWidth
                  size="small"
                  margin="normal"
                  autoComplete="email"
                  placeholder="your.email@example.com"
                  startAdornment={
                    <EmailIcon fontSize="small" color="primary" />
                  }
                />

                <MuiTextField
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 8, message: "Min 8 characters" },
                  })}
                  error={errors.password}
                  label="Password"
                  type="password"
                  fullWidth
                  size="small"
                  margin="normal"
                  autoComplete="new-password"
                  placeholder="Enter password"
                  startAdornment={<LockIcon fontSize="small" color="primary" />}
                />

                <MuiTextArea
                  {...register("description", {
                    required: "Description is required",
                    maxLength: { value: 2000, message: "Max 2000 characters" },
                  })}
                  error={errors.description}
                  helperText="Provide a detailed description"
                  label="Description"
                  maxLength={2000}
                  rows={4}
                  placeholder="Enter a detailed description..."
                />
              </Stack>
            </Box>

            <Divider />

            {/* Section 2: Number Input Components */}
            <Box>
              <Typography variant="h6" gutterBottom>
                2. Number Input Components
              </Typography>
              <Stack spacing={2}>
                <MuiNumberField
                  {...register("quantity", {
                    required: "Quantity is required",
                    min: { value: 0, message: "Must be >= 0" },
                  })}
                  error={errors.quantity}
                  helperText="Enter quantity in pieces"
                  label="Quantity"
                  min={0}
                  placeholder="0"
                />

                <MuiNumberField
                  {...register("price", {
                    required: "Price is required",
                    min: { value: 0, message: "Must be >= 0" },
                  })}
                  error={errors.price}
                  helperText="Price in Ethiopian Birr"
                  label="Price (ETB)"
                  min={0}
                  step={0.01}
                  decimalPlaces={2}
                  placeholder="0.00"
                />
              </Stack>
            </Box>

            <Divider />

            {/* Section 3: Select Components (Controller - Complex) */}
            <Box>
              <Typography variant="h6" gutterBottom>
                3. Select Components (Controller - Wrapped in Parent)
              </Typography>
              <Stack spacing={2}>
                <Controller
                  name="department"
                  control={control}
                  rules={{ required: "Department is required" }}
                  render={({ field, fieldState }) => (
                    <MuiSelectAutocomplete
                      {...field}
                      label="Department"
                      error={fieldState.error}
                      helperText={fieldState.error?.message}
                      options={departmentOptions}
                      getOptionLabel={(option) => option.name}
                      getOptionValue={(option) => option._id}
                      placeholder="Select a department"
                    />
                  )}
                />

                <Controller
                  name="assignees"
                  control={control}
                  rules={{
                    required: "At least one assignee is required",
                    validate: (value) =>
                      value.length <= 20 || "Maximum 20 assignees allowed",
                  }}
                  render={({ field, fieldState }) => (
                    <MuiMultiSelect
                      {...field}
                      label="Assignees"
                      error={fieldState.error}
                      helperText={fieldState.error?.message}
                      options={userOptions}
                      getOptionLabel={(option) => option.fullName}
                      getOptionValue={(option) => option._id}
                      maxItems={20}
                      placeholder="Select assignees"
                    />
                  )}
                />
              </Stack>
            </Box>

            <Divider />

            {/* Section 4: Date Components (Controller - Complex) */}
            <Box>
              <Typography variant="h6" gutterBottom>
                4. Date Components (Controller - Wrapped in Parent)
              </Typography>
              <Stack spacing={2}>
                <Controller
                  name="startDate"
                  control={control}
                  rules={{ required: "Start date is required" }}
                  render={({ field, fieldState }) => (
                    <MuiDatePicker
                      {...field}
                      label="Start Date"
                      error={fieldState.error}
                      helperText={fieldState.error?.message}
                      placeholder="Select start date"
                    />
                  )}
                />

                <Controller
                  name="dateRange"
                  control={control}
                  rules={{
                    validate: (value) =>
                      (!!value?.start && !!value?.end) ||
                      "Please select date range",
                  }}
                  render={({ field, fieldState }) => (
                    <MuiDateRangePicker
                      {...field}
                      label="Date Range"
                      error={fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Stack>
            </Box>

            <Divider />

            {/* Section 5: Boolean Input Components */}
            <Box>
              <Typography variant="h6" gutterBottom>
                5. Boolean Input Components
              </Typography>
              <Stack spacing={2}>
                <MuiCheckbox
                  {...register("rememberMe")}
                  error={errors.rememberMe}
                  helperText="Keep me signed in for 7 days"
                  label="Remember Me"
                />

                <MuiSwitch
                  {...register("emailNotifications")}
                  error={errors.emailNotifications}
                  helperText="Receive email updates about tasks"
                  label="Email Notifications"
                />
              </Stack>
            </Box>

            <Divider />

            {/* Section 6: Radio Group Component */}
            <Box>
              <Typography variant="h6" gutterBottom>
                6. Radio Group Component
              </Typography>
              <Controller
                name="priority"
                control={control}
                rules={{ required: "Priority is required" }}
                render={({ field, fieldState }) => (
                  <MuiRadioGroup
                    {...field}
                    label="Priority"
                    error={fieldState.error}
                    helperText={fieldState.error?.message || "Select task priority level"}
                    options={priorityOptions}
                    row
                  />
                )}
              />
            </Box>

            <Divider />

            {/* Section 7: Slider Component */}
            <Box>
              <Typography variant="h6" gutterBottom>
                7. Slider Component
              </Typography>
              <Controller
                name="percentage"
                control={control}
                rules={{
                  required: "Percentage is required",
                  min: { value: 0, message: "Must be >= 0" },
                  max: { value: 100, message: "Must be <= 100" },
                }}
                render={({ field, fieldState }) => (
                  <MuiSlider
                    {...field}
                    label="Skill Percentage"
                    error={fieldState.error}
                    helperText={fieldState.error?.message || "Skill proficiency level"}
                    min={0}
                    max={100}
                    step={1}
                  />
                )}
              />
            </Box>

            <Divider />

            {/* Section 8: Rating Component */}
            <Box>
              <Typography variant="h6" gutterBottom>
                8. Rating Component (with readOnly support)
              </Typography>
              <Stack spacing={2}>
                <Controller
                  name="rating"
                  control={control}
                  rules={{ required: "Rating is required" }}
                  render={({ field, fieldState }) => (
                    <MuiRating
                      {...field}
                      label="Rate this form"
                      error={fieldState.error}
                      helperText={
                        fieldState.error?.message || "Rate your experience"
                      }
                      max={5}
                      precision={0.5}
                      readOnly={false}
                    />
                  )}
                />

                <MuiRating
                  name="averageRating"
                  label="Average Rating (Read-only)"
                  value={4.5}
                  onChange={() => {}}
                  max={5}
                  precision={0.1}
                  readOnly={true}
                />
              </Stack>
            </Box>

            <Divider />

            {/* Submit Button */}
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
              >
                Submit Form
              </Button>
              <Button
                type="button"
                variant="outlined"
                color="secondary"
                size="large"
                onClick={() => {
                  // console.log("Current form values:", watch());
                  // Removed watch() to prevent re-renders as per instructions
                  console.log("Use 'Submit Form' to view values.");
                }}
              >
                Log Values
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>

      {/* Implementation Notes */}
      <Paper elevation={1} sx={{ p: 3, mt: 3, bgcolor: "info.light" }}>
        <Typography variant="h6" gutterBottom>
          Updated Implementation Notes
        </Typography>
        <Stack spacing={1}>
          <Typography variant="body2">
            ✅ <strong>Spread Register Pattern</strong>: All simple components
            use <code>{"{ ...register('name', rules) }"}</code>
          </Typography>
          <Typography variant="body2">
            ✅ <strong>Props Passed</strong>: error, helperText, onChange,
            onBlur, and ...muiProps for all components
          </Typography>
          <Typography variant="body2">
            ✅ <strong>No PropTypes</strong>: Removed PropTypes from components
            with displayName
          </Typography>
          <Typography variant="body2">
            ✅ <strong>TextField Adornments</strong>: startAdornment and
            endAdornment with memoization
          </Typography>
          <Typography variant="body2">
            ✅ <strong>TextArea Character Counter</strong>: Shows character
            count with maxLength prop
          </Typography>
          <Typography variant="body2">
            ✅ <strong>Rating readOnly</strong>: Supports readOnly prop for
            display-only ratings
          </Typography>
          <Typography variant="body2">
            ✅ <strong>Complex Components</strong>: SelectAutocomplete,
            MultiSelect, DatePicker, DateRangePicker, RadioGroup, Slider, Rating
            are wrapped with Controller.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default App;
