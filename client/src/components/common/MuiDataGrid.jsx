/**
 * MuiDataGrid Component - Reusable DataGrid
 *
 * Requirements: 15.8, 28.9, 23.8
 */

import { DataGrid } from "@mui/x-data-grid";
import { Box, Paper, Typography, LinearProgress } from "@mui/material";
import MuiSkeleton from "./MuiSkeleton";

const MuiDataGrid = ({
  rows = [],
  columns = [],
  loading = false,
  error,
  rowCount = 0,
  pagination, // { page, limit } - page is 1-based
  onPaginationChange,
  sortModel,
  onSortModelChange,
  filterModel,
  onFilterModelChange,
  checkboxSelection = false,
  disableRowSelectionOnClick = true,
  getRowId = (row) => row._id,
  sx,
  ...muiProps
}) => {
  // Convert 1-based backend page to 0-based MUI page
  const muiPage = pagination && pagination.page > 0 ? pagination.page - 1 : 0;
  const muiPageSize = pagination ? pagination.limit : 10;

  const handlePaginationModelChange = (model) => {
    if (onPaginationChange) {
      // Convert 0-based MUI page back to 1-based backend page
      onPaginationChange({
        page: model.page + 1,
        limit: model.pageSize,
      });
    }
  };

  if (error) {
    return (
      <Paper
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "error.light",
          color: "error.dark",
          height: 400,
        }}
      >
        <Typography variant="h6">
          Error loading data: {error.data?.message || error.message || "Unknown error"}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ width: "100%", height: 500, ...sx }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        rowCount={rowCount}
        getRowId={getRowId}
        paginationMode="server"
        sortingMode="server"
        filterMode="server"
        paginationModel={{
          page: muiPage,
          pageSize: muiPageSize,
        }}
        onPaginationModelChange={handlePaginationModelChange}
        sortModel={sortModel}
        onSortModelChange={onSortModelChange}
        filterModel={filterModel}
        onFilterModelChange={onFilterModelChange}
        checkboxSelection={checkboxSelection}
        disableRowSelectionOnClick={disableRowSelectionOnClick}
        slots={{
          loadingOverlay: LinearProgress,
          noRowsOverlay: () => (
             <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
               <Typography color="text.secondary">No records found</Typography>
             </Box>
          ),
        }}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        {...muiProps}
      />
    </Box>
  );
};

export default MuiDataGrid;
