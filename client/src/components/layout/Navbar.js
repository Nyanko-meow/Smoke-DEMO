import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    IconButton,
    Menu,
    MenuItem,
    Avatar
} from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import { logout } from '../../store/slices/authSlice';

const Navbar = () => {
    const dispatch = useDispatch();
    const auth = useSelector(state => state.auth || {});
    const user = auth.user || null;
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        dispatch(logout());
        handleClose();
    };

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography
                    variant="h6"
                    component={RouterLink}
                    to="/"
                    sx={{
                        flexGrow: 1,
                        textDecoration: 'none',
                        color: 'inherit',
                        fontWeight: 'bold'
                    }}
                >
                    Smoking Cessation
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        color="inherit"
                        component={RouterLink}
                        to="/blog"
                    >
                        Blog
                    </Button>
                    <Button
                        color="inherit"
                        component={RouterLink}
                        to="/community"
                    >
                        Community
                    </Button>

                    {user ? (
                        <>
                            <IconButton
                                size="large"
                                onClick={handleMenu}
                                color="inherit"
                            >
                                {user.avatar ? (
                                    <Avatar src={user.avatar} alt={user.name} />
                                ) : (
                                    <AccountCircle />
                                )}
                            </IconButton>
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
                            >
                                <MenuItem
                                    component={RouterLink}
                                    to="/profile"
                                    onClick={handleClose}
                                >
                                    Profile
                                </MenuItem>
                                {user.role === 'admin' && (
                                    <MenuItem
                                        component={RouterLink}
                                        to="/admin"
                                        onClick={handleClose}
                                    >
                                        Admin Dashboard
                                    </MenuItem>
                                )}
                                <MenuItem onClick={handleLogout}>Logout</MenuItem>
                            </Menu>
                        </>
                    ) : (
                        <>
                            <Button
                                color="inherit"
                                component={RouterLink}
                                to="/login"
                            >
                                Login
                            </Button>
                            <Button
                                color="inherit"
                                component={RouterLink}
                                to="/register"
                            >
                                Register
                            </Button>
                        </>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar; 