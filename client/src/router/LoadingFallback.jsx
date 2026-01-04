/**
 * LoadingFallback Component - Loading State for Routes
 *
 * Displays loading indicator while routes are being loaded.
 *
 * Requirements: 23.7
 */

import MuiLoading from "../components/common/MuiLoading";

const LoadingFallback = () => {
  return <MuiLoading fullScreen message="Loading..." />;
};

export default LoadingFallback;
