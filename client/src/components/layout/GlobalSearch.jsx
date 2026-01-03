/**
 * GlobalSearch Component - Global Search Modal
 *
 * Requirements: 17.4
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  InputBase,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import HistoryIcon from "@mui/icons-material/History";
import CloseIcon from "@mui/icons-material/Close";
import TaskIcon from "@mui/icons-material/Assignment";
import PersonIcon from "@mui/icons-material/Person";

const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Handle Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleClose = () => {
    setOpen(false);
    setQuery("");
  };

  // Mock results
  const recentSearches = ["Project Alpha", "Deployment Tasks", "John Doe"];

  return (
    <>
       {/* Trigger can be added to Header directly, this is the modal */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            position: "fixed",
            top: 50,
            m: 0,
            borderRadius: 2,
            maxHeight: "80vh",
          },
        }}
        scroll="paper"
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center" }}>
          <SearchIcon color="action" sx={{ mr: 2 }} />
          <InputBase
            placeholder="Search tasks, users, projects..."
            fullWidth
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ fontSize: "1.1rem" }}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="caption" sx={{ border: 1, borderColor: "divider", px: 1, borderRadius: 1, color: "text.secondary" }}>
              ESC
            </Typography>
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        <DialogContent sx={{ p: 0 }}>
          {query.length === 0 ? (
            <Box sx={{ py: 2 }}>
              <Typography variant="overline" sx={{ px: 3, color: "text.secondary" }}>
                Recent Searches
              </Typography>
              <List>
                {recentSearches.map((search, index) => (
                  <ListItemButton key={index} onClick={() => setQuery(search)}>
                    <ListItemIcon>
                      <HistoryIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={search} />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          ) : (
            <Box sx={{ py: 2 }}>
              <Typography variant="overline" sx={{ px: 3, color: "text.secondary" }}>
                Tasks
              </Typography>
              <List>
                <ListItemButton>
                  <ListItemIcon>
                    <TaskIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Fix Homepage Bug"
                    secondary="In Progress • High Priority"
                  />
                </ListItemButton>
              </List>

              <Typography variant="overline" sx={{ px: 3, color: "text.secondary", mt: 2, display: "block" }}>
                People
              </Typography>
              <List>
                <ListItemButton>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Alice Smith" secondary="Developer" />
                </ListItemButton>
              </List>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GlobalSearch;
