import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static" elevation={2}>
                <Toolbar>
                    <DirectionsCarIcon sx={{ mr: 2 }} />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                        СТО Блокчейн
                    </Typography>

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

            {/* Контейнер для основного контенту сторінок */}
            <Container component="main" sx={{ flexGrow: 1, py: 4, display: 'flex', flexDirection: 'column' }}>
                <Outlet />
            </Container>
        </Box>
    );
}