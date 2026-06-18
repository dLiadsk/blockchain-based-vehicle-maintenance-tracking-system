import type {JSX} from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';

import { useAuth } from '../context/AuthContext';

/**
 * Main application layout component.
 * Wraps all protected routes, providing a persistent navigation bar (AppBar) and a main content area.
 * * @returns {JSX.Element} The rendered layout with navigation and nested route outlet.
 */
export default function Layout(): JSX.Element {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); // FIXED: Imported and initialized useLocation hook

    const handleLogout = (): void => {
        logout();
        navigate('/login', { replace: true });
    };

    // Extracting role check for cleaner JSX
    const isDriver = localStorage.getItem('userRole') === 'ROLE_USER';

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Top Navigation Bar */}
            <AppBar position="static" elevation={2}>
                <Toolbar>
                    <DirectionsCarIcon sx={{ mr: 2 }} />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                        СТО Блокчейн
                    </Typography>

                    {/* Driver Navigation Menu */}
                    {isDriver && (
                        <>
                            {location.pathname !== '/driver' && (
                                <Button color="inherit" onClick={() => navigate('/driver')} sx={{ mr: 2 }}>
                                    Мій Гараж
                                </Button>
                            )}

                            {!location.pathname.startsWith('/sto-catalog') && (
                                <Button color="inherit" onClick={() => navigate('/sto-catalog')} sx={{ mr: 2 }}>
                                    Каталог СТО
                                </Button>
                            )}

                            {!location.pathname.startsWith('/my-requests') && (
                                <Button color="inherit" onClick={() => navigate('/my-requests')} sx={{ mr: 2 }}>
                                    Мої заявки
                                </Button>
                            )}
                        </>
                    )}

                    {/* User Profile & Logout Section */}
                    {user && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                {user.email}
                            </Typography>
                            <Button
                                color="inherit"
                                variant="outlined"
                                size="small"
                                onClick={handleLogout}
                            >
                                Вийти
                            </Button>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>

            {/* Main Content Area where child routes are rendered via <Outlet /> */}
            <Container
                component="main"
                maxWidth="lg"
                sx={{ flexGrow: 1, py: 4, display: 'flex', flexDirection: 'column' }}
            >
                <Outlet />
            </Container>
        </Box>
    );
}