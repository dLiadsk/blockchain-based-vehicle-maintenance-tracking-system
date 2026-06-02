import React, { useState, type JSX } from 'react';
import { Box, Button, TextField, Typography, Container, Paper, Alert } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface LoginResponse {
    token: string;
}

interface DecodedToken {
    role: string;
    sub?: string;
    exp?: number;
}

/**
 * Mapping of user roles to their respective dashboard routes.
 * Keeps navigation centralized and easily extensible.
 */
const ROLE_DASHBOARD_ROUTES: Record<string, string> = {
    'ROLE_ADMIN': '/admin',
    'ROLE_STO': '/sto',
    'ROLE_USER': '/driver',
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * User authentication component.
 * Handles credentials submission, JWT token retrieval and decoding,
 * and role-based redirection.
 */
export default function Login(): JSX.Element {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');

    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setError('');

        try {
            // Request authentication token from the backend
            const response = await api.post<LoginResponse>('/auth/login', { email, password });
            const token = response.data.token;

            // Persist token in global auth state
            login(token);

            // Decode token to extract user role for redirection
            const decoded = jwtDecode<DecodedToken>(token);

            // Store role locally (serves as a sync for ProtectedRoute)
            if (decoded.role) {
                localStorage.setItem('userRole', decoded.role);
            }

            // Smart redirect based on role mapping
            // Using replace: true prevents the user from navigating back to the login page
            const targetRoute = decoded.role ? ROLE_DASHBOARD_ROUTES[decoded.role] || '/driver' : '/driver';
            navigate(targetRoute, { replace: true });

        } catch (err) {
            console.error('Login failed:', err);
            setError('Невірний email або пароль, або сервер недоступний.');
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
                    <Typography component="h1" variant="h5" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
                        Вхід у систему
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Email адреса"
                            type="email"
                            value={email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Пароль"
                            type="password"
                            value={password}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Увійти
                        </Button>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 3 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Ще не маєте акаунту?
                            </Typography>
                            <Button
                                component={RouterLink}
                                to="/register"
                                fullWidth
                                variant="outlined"
                                color="primary"
                            >
                                Створити акаунт
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}