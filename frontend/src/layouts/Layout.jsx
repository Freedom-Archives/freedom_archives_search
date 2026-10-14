import AccountCircle from "@mui/icons-material/AccountCircle";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { ConfirmProvider } from "material-ui-confirm";
import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { useAppStore, useAuth } from "src/stores";
import logger from "src/utils/logger";
import ChangePassword from "src/views/ChangePassword";

import { app } from "../api";
import Authentication from "../Authentication";
import Breadcrumbs from "../components/Breadcrumbs";
import ErrorBoundary from "../components/ErrorBoundary";
import Notifications from "../components/Notifications";
import Loading from "../views/Loading";
import Sidebar from "../views/Sidebar";

const QuickSearch = React.lazy(() => import("../components/QuickSearch"));
const DRAWERWIDTH = 256;

export default function Layout() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ConfirmProvider defaultOptions={{ confirmationButtonProps: { variant: "contained" } }}>
        <LayoutInner />
      </ConfirmProvider>
    </LocalizationProvider>
  );
}

function LayoutInner() {
  const { isAuthenticated } = useAuth();
  const style = React.useMemo(
    () =>
      isAuthenticated
        ? {}
        : {
            marginLeft: 0,
            width: "100%",
          },
    [isAuthenticated],
  );

  logger.log("Layout RENDER");
  return (
    <Box className="App" sx={{ backgroundColor: "#efefef", height: "100vh", display: "flex", flexDirection: "column" }}>
      <NavBar />
      <NavigationListener />
      <Stack direction="row" sx={{ overflow: "hidden", height: "100%" }}>
        {isAuthenticated && (
          <Sidebar
            variant="permanent"
            className="sidebar"
            sx={{
              width: DRAWERWIDTH,
            }}
            slotProps={{
              paper: { sx: { width: DRAWERWIDTH } },
            }}
          />
        )}
        <Stack
          sx={{
            backgroundColor: "#efefef",
          }}
          className="flex-container"
          style={style}
        >
          <Toolbar variant="dense" />
          <Loading>
            <Main />
          </Loading>
        </Stack>
      </Stack>
    </Box>
  );
}

function NavigationListener() {
  const location = useLocation();
  const removeNotificationsOnNavigate = useAppStore((state) => state.removeNotificationsOnNavigate);

  useEffect(() => {
    // Clear navigation notifications when location changes
    removeNotificationsOnNavigate();
  }, [location, removeNotificationsOnNavigate]);

  return null;
}

export function Logout() {
  const { isAuthenticated, user } = useAuth();
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const changePassword = () => {
    handleClose();
    setOpenChangePassword(true);
  };

  const logout = () => {
    handleClose();
    app.logout();
  };

  return isAuthenticated ? (
    <div className="logout">
      <IconButton
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        color="inherit"
        sx={{ backgroundColor: "primary.light", width: 30, height: 30 }}
      >
        <AccountCircle />
      </IconButton>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            "aria-labelledby": "basic-button",
          },
        }}
      >
        <MenuItem sx={{ pointerEvents: "none", color: "text.primary", fontWeight: "bold" }}>{user.full_name}</MenuItem>
        <Divider />
        <MenuItem onClick={changePassword}>
          <ListItemIcon>
            <Icon>password</Icon>
          </ListItemIcon>
          Change Password
        </MenuItem>
        <MenuItem onClick={logout}>
          <ListItemIcon>
            <Icon>logout</Icon>
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
      <ChangePassword open={openChangePassword} handleClose={() => setOpenChangePassword(false)} user={user} />
    </div>
  ) : (
    ""
  );
}

function NavBar() {
  const { isAuthenticated } = useAuth();
  return (
    <AppBar
      color={import.meta.env.DEV ? "warning" : "publicPrimary"}
      position="fixed"
      elevation={0}
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar className="topnav" variant="dense" sx={{ gap: 1 }}>
        <Breadcrumbs />
        {isAuthenticated && <QuickSearch />}
        <Logout />
      </Toolbar>
    </AppBar>
  );
}

export function Main() {
  const loading = useAppStore((state) => state.loading);

  const loadingStyle = loading
    ? {
        opacity: 0.6,
      }
    : {};
  // logger.log("Main RENDER", location);

  return (
    <Container
      maxWidth="xl"
      sx={{
        opacity: 1,
        transition: "opacity 0.3s",
        paddingY: "8px",
        overflow: "hidden",
        flex: "1 1 auto",
        position: "relative",
        ...loadingStyle,
      }}
    >
      <Notifications />
      <Authentication />
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </Container>
  );
}

// Main.whyDidYouRender = true;
