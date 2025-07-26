import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
} from "@mui/material";
import {
  QrCode as QrCodeIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";
import axios from "axios";

const AuthenticationModal = ({
  open,
  onClose,
  sessionId,
  authUrl,
  onAuthSuccess,
  apiBaseUrl,
}) => {
  const [authStatus, setAuthStatus] = useState("pending"); // pending, success, error
  const [statusMessage, setStatusMessage] = useState("");
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (open && sessionId) {
      startAuthStatusPolling();
    }

    return () => {
      setIsPolling(false);
    };
  }, [open, sessionId]);

  const startAuthStatusPolling = useCallback(async () => {
    setIsPolling(true);
    setAuthStatus("pending");

    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(
          `${apiBaseUrl}/session/${sessionId}/status`
        );
        const { authenticated } = response.data;

        if (authenticated) {
          setAuthStatus("success");
          setStatusMessage("Authentication successful!");
          setIsPolling(false);
          clearInterval(pollInterval);

          setTimeout(() => {
            onAuthSuccess();
            onClose();
          }, 1500);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setAuthStatus("error");
        setStatusMessage("Error checking authentication status");
        setIsPolling(false);
        clearInterval(pollInterval);
      }
    }, 2000);

    // Stop polling after 5 minutes
    setTimeout(() => {
      setIsPolling(false);
      clearInterval(pollInterval);
      setStatusMessage("Authentication timeout. Please try again.");
    }, 300000);
  }, [apiBaseUrl, sessionId, onAuthSuccess, onClose]);

  const openAuthUrl = () => {
    if (authUrl) {
      window.open(authUrl, "_blank");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <QrCodeIcon color="primary" />
          <Typography variant="h6">Authentication Required</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
          <Typography variant="body1" textAlign="center">
            Please authenticate to access your financial data securely.
          </Typography>

          {authUrl && (
            <Paper elevation={2} sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="subtitle2" gutterBottom>
                Scan QR Code or Click the Button Below
              </Typography>

              {/* QR Code would go here - for now using placeholder */}
              <Box
                sx={{
                  width: 200,
                  height: 200,
                  bgcolor: "grey.100",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  mb: 2,
                }}
              >
                <QrCodeIcon sx={{ fontSize: 100, color: "grey.400" }} />
              </Box>

              <Button
                variant="contained"
                onClick={openAuthUrl}
                disabled={!authUrl}
                size="large"
              >
                Open Authentication Page
              </Button>
            </Paper>
          )}

          {/* Status Display */}
          <Box width="100%" textAlign="center">
            {authStatus === "pending" && isPolling && (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={2}
              >
                <CircularProgress size={24} />
                <Typography>Waiting for authentication...</Typography>
              </Box>
            )}

            {authStatus === "success" && (
              <Alert severity="success" icon={<CheckIcon />}>
                Authentication successful! Loading your financial data...
              </Alert>
            )}

            {authStatus === "error" && (
              <Alert severity="error">
                {statusMessage || "Authentication failed. Please try again."}
              </Alert>
            )}

            {statusMessage && authStatus === "pending" && (
              <Typography variant="body2" color="text.secondary">
                {statusMessage}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={authStatus === "success"}>
          Cancel
        </Button>
        {authStatus !== "success" && (
          <Button
            variant="contained"
            onClick={startAuthStatusPolling}
            disabled={isPolling}
          >
            {isPolling ? "Checking..." : "Check Status"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AuthenticationModal;
