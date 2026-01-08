import { useFormContext, Controller } from "react-hook-form";
import Grid from "@mui/material/Grid";
import MuiTextField from "../../common/MuiTextField";
import MuiSelectAutocomplete from "../../common/MuiSelectAutocomplete";
import BusinessIcon from "@mui/icons-material/Business";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WorkIcon from "@mui/icons-material/Work";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import {
  LIMITS,
  INDUSTRIES as INDUSTRIES_MAP,
  PHONE_REGEX,
} from "../../../utils/constants.js";

const ORGANIZATION_SIZES = [
  { id: "small", label: "Small", icon: <HomeWorkIcon fontSize="small" /> },
  {
    id: "medium",
    label: "Medium",
    icon: <BusinessCenterIcon fontSize="small" />,
  },
  { id: "large", label: "Large", icon: <CorporateFareIcon fontSize="small" /> },
];

const INDUSTRIES = Object.values(INDUSTRIES_MAP).map((industry) => ({
  id: industry,
  label: industry,
}));

const OrganizationDetailsStep = () => {
  const {
    register,
    formState: { errors },
    control,
  } = useFormContext();

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <MuiTextField
          {...register("organizationName", {
            required: "Organization name is required",
            minLength: { value: 2, message: "Minimum 2 characters" },
            maxLength: {
              value: LIMITS.ORGANIZATION_NAME_MAX,
              message: `Maximum ${LIMITS.ORGANIZATION_NAME_MAX} characters`,
            },
          })}
          required
          error={errors.organizationName}
          label="Organization Name"
          placeholder="e.g. Acme Corp"
          fullWidth
          size="small"
          startAdornment={<BusinessIcon fontSize="small" color="primary" />}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTextField
          {...register("organizationEmail", {
            required: "Organization email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Invalid email address",
            },
          })}
          required
          error={errors.organizationEmail}
          label="Organization Email"
          placeholder="e.g. contact@acmecorp.com"
          type="email"
          fullWidth
          size="small"
          startAdornment={<EmailIcon fontSize="small" color="primary" />}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTextField
          {...register("organizationPhone", {
            required: "Phone number is required",
            pattern: {
              value: PHONE_REGEX,
              message: "Please enter a valid phone number",
            },
          })}
          required
          error={errors.organizationPhone}
          label="Phone Number"
          placeholder="e.g. +1 (555) 000-0000"
          fullWidth
          size="small"
          startAdornment={<PhoneIcon fontSize="small" color="primary" />}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <MuiTextField
          {...register("organizationAddress", {
            required: "Address is required",
            minLength: { value: 2, message: "Minimum 2 characters" },
            maxLength: {
              value: LIMITS.ADDRESS_MAX,
              message: `Maximum ${LIMITS.ADDRESS_MAX} characters`,
            },
          })}
          required
          error={errors.organizationAddress}
          label="Address"
          placeholder="e.g. 123 Business Rd, Suite 100, Metropolis, 54321"
          fullWidth
          size="small"
          multiline
          rows={2}
          startAdornment={<LocationOnIcon fontSize="small" color="primary" />}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <Controller
          name="organizationSize"
          control={control}
          rules={{ required: "Organization size is required" }}
          render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
            <MuiSelectAutocomplete
              name="organizationSize"
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              label="Organization Size"
              placeholder="Select organization size"
              options={ORGANIZATION_SIZES}
              required
              fullWidth
              size="small"
              error={error}
            />
          )}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <Controller
          name="organizationIndustry"
          control={control}
          rules={{ required: "Industry is required" }}
          render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
            <MuiSelectAutocomplete
              name="organizationIndustry"
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              label="Industry"
              placeholder="Select your industry"
              options={INDUSTRIES}
              required
              fullWidth
              size="small"
              error={error}
            />
          )}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <MuiTextField
          {...register("description", {
            required: "Description is required",
            minLength: { value: 2, message: "Minimum 2 characters" },
            maxLength: {
              value: LIMITS.DESCRIPTION_MAX,
              message: `Maximum ${LIMITS.DESCRIPTION_MAX} characters`,
            },
          })}
          required
          error={errors.description}
          label="Description"
          fullWidth
          placeholder="Tell us about your organization"
          size="small"
          multiline
          rows={4}
        />
      </Grid>
    </Grid>
  );
};

export default OrganizationDetailsStep;

