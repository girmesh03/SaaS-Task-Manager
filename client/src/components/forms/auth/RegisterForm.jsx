import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { useForm, FormProvider } from "react-hook-form";
import { toast } from "react-toastify";
import {
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Stepper,
  Step,
  StepButton,
  StepLabel,
  StepContent,
  MobileStepper,
  StepConnector,
  stepConnectorClasses,
  CircularProgress,
  useTheme,
  useMediaQuery,
  styled,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import RateReviewIcon from "@mui/icons-material/RateReview";
import CheckIcon from "@mui/icons-material/Check";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import { keyframes } from "@mui/material";

import { useAuth } from "../../../hooks/useAuth";
import OrganizationDetailsStep from "./OrganizationDetailsStep";
import UserDetailsStep from "./UserDetailsStep";
import UploadAttachmentsStep from "./UploadAttachmentsStep";
import ReviewStep from "./ReviewStep";
import { handleApiError } from "../../../utils/errorHandler";

const steps = [
  "Organization Details",
  "Admin User Details",
  "Upload Attachments",
  "Review and Submit",
];

// Custom StepConnector with better styling
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage:
        "linear-gradient(95deg, rgb(242,113,33) 0%, rgb(233,64,87) 50%, rgb(138,35,135) 100%)",
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage:
        "linear-gradient(95deg, rgb(242,113,33) 0%, rgb(233,64,87) 50%, rgb(138,35,135) 100%)",
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor:
      theme.palette.mode === "dark" ? theme.palette.grey[800] : "#eaeaf0",
    borderRadius: 1,
  },
}));

const pulse = keyframes`
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(233, 64, 87, 0.4); }
  70% { transform: scale(1); box-shadow: 0 0 0 12px rgba(233, 64, 87, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(233, 64, 87, 0); }
`;

// Custom StepIcon
const ColorlibStepIconRoot = styled("div")(({ theme, ownerState }) => ({
  backgroundColor:
    theme.palette.mode === "dark" ? theme.palette.grey[700] : "#ccc",
  zIndex: 1,
  color: "#fff",
  width: 50,
  height: 50,
  display: "flex",
  borderRadius: "50%",
  justifyContent: "center",
  alignItems: "center",
  transition: "all 0.3s ease-in-out",
  ...(ownerState.active && {
    backgroundImage:
      "linear-gradient(136deg, rgb(242,113,33) 0%, rgb(233,64,87) 50%, rgb(138,35,135) 100%)",
    boxShadow: "0 4px 10px 0 rgba(0,0,0,.25)",
    animation: `${pulse} 2s infinite`,
  }),
  ...(ownerState.completed && {
    backgroundImage:
      "linear-gradient(136deg, rgb(242,113,33) 0%, rgb(233,64,87) 50%, rgb(138,35,135) 100%)",
    transform: "scale(1.1)",
  }),
}));

function ColorlibStepIcon(props) {
  const { active, completed, className, icon } = props;

  const icons = {
    1: <BusinessIcon />,
    2: <PersonIcon />,
    3: <CloudUploadIcon />,
    4: <RateReviewIcon />,
  };

  return (
    <ColorlibStepIconRoot
      ownerState={{ completed, active }}
      className={className}
    >
      {completed ? <CheckIcon /> : icons[String(icon)]}
    </ColorlibStepIconRoot>
  );
}

const RegisterForm = () => {
  const [activeStep, setActiveStep] = useState(1); // Start from step 1
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, register: registerUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const methods = useForm({
    mode: "onTouched",
    reValidateMode: "onChange",
    shouldUnregister: false, // This ensures fields persist when unmounted
    defaultValues: {
      organizationName: "",
      organizationEmail: "",
      organizationPhone: "",
      organizationAddress: "",
      organizationSize: null,
      organizationIndustry: null,
      description: "",
      firstName: "",
      lastName: "",
      userEmail: "",
      password: "",
      confirmPassword: "",
      position: "",
      departmentName: "",
      departmentDesc: "",
    },
  });

  const { handleSubmit, trigger, getValues } = methods;

  // Define fields for each step (for validation) - now 1-based indexing
  const stepFields = {
    1: [
      "organizationName",
      "organizationEmail",
      "organizationPhone",
      "organizationAddress",
      "organizationSize",
      "organizationIndustry",
      "description",
    ],
    2: [
      "firstName",
      "lastName",
      "userEmail",
      "password",
      "confirmPassword",
      "position",
      "employeeId",
      "dateOfBirth",
      "departmentName",
      "departmentDesc",
    ],
  };

  const handleNext = async () => {
    // Validate current step fields before proceeding
    const fieldsToValidate = stepFields[activeStep];

    if (fieldsToValidate) {
      const isValid = await trigger(fieldsToValidate);
      if (!isValid) {
        toast.error("Please fix all errors before proceeding");
        return;
      }
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStep = (step) => () => {
    setActiveStep(step);
  };

  const onSubmit = async (data) => {
    try {
      const registrationData = {
        organization: {
          name: data.organizationName,
          email: data.organizationEmail,
          phone: data.organizationPhone,
          address: data.organizationAddress,
          size: data.organizationSize?.id || data.organizationSize,
          industry: data.organizationIndustry?.id || data.organizationIndustry,
          description: data.description,
        },
        department: {
          name: data.departmentName,
          description: data.departmentDesc,
        },
        user: {
          firstName: data.firstName,
          lastName: data.lastName,
          position: data.position,
          email: data.userEmail,
          password: data.password,
          employeeId: data.employeeId || undefined,
          dateOfBirth: data.dateOfBirth || undefined,
          joinedAt: new Date().toISOString(),
        },
      };
      await registerUser(registrationData);
      toast.success(
        "Organization registered successfully! Welcome aboard."
      );
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const parsedError = handleApiError(err);
      toast.error(parsedError.message);
    }
  };

  // Get step content for the active step (1-based)
  const getStepContent = () => {
    switch (activeStep) {
      case 1:
        return <OrganizationDetailsStep />;
      case 2:
        return <UserDetailsStep />;
      case 3:
        return <UploadAttachmentsStep />;
      case 4:
        return <ReviewStep getValues={getValues} />;
      default:
        return null;
    }
  };

  // Render desktop stepper
  const renderDesktopStepper = () => (
    <Stepper
      activeStep={activeStep - 1} // Convert to 0-based for MUI Stepper
      alternativeLabel
      connector={<ColorlibConnector />}
      sx={{ mb: 5 }}
    >
      {steps.map((label, index) => (
        <Step key={label}>
          <StepButton
            onClick={handleStep(index + 1)} // 1-based step handling
          >
            <StepLabel
              StepIconComponent={ColorlibStepIcon}
              sx={{
                "& .MuiStepLabel-label": {
                  fontSize: { sm: "0.875rem", md: "1rem" },
                  fontWeight: 500,
                  mt: 1,
                },
              }}
            >
              {label}
            </StepLabel>
          </StepButton>
        </Step>
      ))}
    </Stepper>
  );

  // Render mobile stepper
  const renderMobileStepper = () => (
    <Stepper activeStep={activeStep - 1} orientation="vertical" sx={{ mb: 2 }}>
      {steps.map((label, index) => (
        <Step key={label}>
          <StepLabel
            StepIconComponent={ColorlibStepIcon}
            sx={{
              "& .MuiStepLabel-label": {
                fontSize: "0.875rem",
                fontWeight: activeStep === index + 1 ? 600 : 400,
              },
            }}
          >
            {label}
          </StepLabel>
          <StepContent>
            <Typography variant="body2" color="text.secondary">
              {index + 1 === activeStep &&
                `Step ${index + 1} of ${steps.length}`}
            </Typography>
          </StepContent>
        </Step>
      ))}
    </Stepper>
  );

  const isLastStep = activeStep === steps.length;
  const isFirstStep = activeStep === 1;

  return (
    <Card
      variant="outlined"
      sx={{
        maxWidth: 800,
        width: "100%",
        boxShadow: 2,
        mb: { xs: 8, sm: 0 },
        mx: "auto",
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
        <FormProvider {...methods}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <BusinessIcon
              sx={{
                fontSize: 48,
                color: "primary.main",
                mb: 2,
              }}
            />
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              color="text.primary"
              fontWeight={600}
              sx={{ fontSize: { xs: "1.75rem", sm: "2.125rem" } }}
            >
              Create Organization
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Set up your organization and create your admin account
            </Typography>
          </Box>

          {/* Conditional Stepper Rendering */}
          {isMobile ? renderMobileStepper() : renderDesktopStepper()}

          {isLastStep ? (
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              {getStepContent()}

              {/* Action buttons for desktop */}
              {!isMobile && (
                <Box sx={{ display: "flex", flexDirection: "row", pt: 3 }}>
                  <Button
                    color="inherit"
                    disabled={isFirstStep || isLoading}
                    onClick={handleBack}
                    sx={{
                      mr: 1,
                      py: 1.5,
                      px: 3,
                      fontSize: "1rem",
                    }}
                  >
                    Back
                  </Button>
                  <Box sx={{ flex: "1 1 auto" }} />

                  <Button
                    variant="contained"
                    color="secondary"
                    type="submit"
                    disabled={isLoading}
                    startIcon={
                      isLoading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : null
                    }
                    sx={{
                      py: 1.5,
                      px: 4,
                      fontSize: "1rem",
                      fontWeight: 600,
                    }}
                  >
                    {isLoading ? "Creating..." : "Create"}
                  </Button>
                </Box>
              )}
            </Box>
          ) : (
            <>
              {getStepContent()}
              {!isMobile && (
                <Box sx={{ display: "flex", flexDirection: "row", pt: 3 }}>
                  <Button
                    color="inherit"
                    disabled={isFirstStep || isLoading}
                    onClick={handleBack}
                    sx={{
                      mr: 1,
                      py: 1.5,
                      px: 3,
                      fontSize: "1rem",
                    }}
                  >
                    Back
                  </Button>
                  <Box sx={{ flex: "1 1 auto" }} />
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleNext}
                    disabled={isLoading}
                    sx={{
                      py: 1.5,
                      px: 3,
                      fontSize: "1rem",
                      fontWeight: 600,
                    }}
                  >
                    {activeStep === 3 ? "Review" : "Next"}
                  </Button>
                </Box>
              )}
            </>
          )}

          {/* Fixed MobileStepper for mobile devices */}
          {isMobile && (
            <MobileStepper
              variant="dots"
              steps={steps.length}
              position="static"
              activeStep={activeStep - 1} // Convert to 0-based for MobileStepper
              sx={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: "background.paper",
                borderTop: 1,
                borderColor: "divider",
                zIndex: 1000,
                "& .MuiMobileStepper-dot": {
                  width: 8,
                  height: 8,
                },
                "& .MuiMobileStepper-dotActive": {
                  backgroundColor: "primary.main",
                },
              }}
              nextButton={
                isLastStep ? (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isLoading}
                    startIcon={
                      isLoading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : null
                    }
                    sx={{
                      py: 1,
                      px: 2,
                      fontSize: "0.875rem",
                      fontWeight: 600,
                    }}
                  >
                    {isLoading ? "Creating..." : "Create"}
                  </Button>
                ) : (
                  <Button
                    size="small"
                    onClick={handleNext}
                    disabled={isLoading}
                  >
                    {activeStep === 3 ? "Review" : "Next"}
                    {theme.direction === "rtl" ? (
                      <KeyboardArrowLeft />
                    ) : (
                      <KeyboardArrowRight />
                    )}
                  </Button>
                )
              }
              backButton={
                <Button
                  size="small"
                  onClick={handleBack}
                  disabled={isFirstStep || isLoading}
                >
                  {theme.direction === "rtl" ? (
                    <KeyboardArrowRight />
                  ) : (
                    <KeyboardArrowLeft />
                  )}
                  Back
                </Button>
              }
            />
          )}
        </FormProvider>

        {/* Already have account link */}
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                color: "inherit",
                textDecoration: "none",
              }}
            >
              <Typography
                component="span"
                variant="body2"
                color="primary.main"
                sx={{
                  fontWeight: 600,
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                Sign in here
              </Typography>
            </Link>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RegisterForm;

