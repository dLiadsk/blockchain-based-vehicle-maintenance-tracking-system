import { useState } from 'react';
import { Box, Button, TextField, Typography, Container, Paper, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await api.post('/auth/login', { email, password });
            const token = response.data.token;

            // Зберігаємо токен
            login(token);

            // Декодуємо токен, щоб дізнатися роль
            const decoded = jwtDecode<{ role: string }>(token);

            // Розумний редирект
            if (decoded.role === 'ROLE_ADMIN') {
                navigate('/admin');
            } else if (decoded.role === 'ROLE_STO') {
                navigate('/sto');
            } else {
                navigate('/driver');
            }
        } catch (err) {
            console.error(err);
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
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Пароль"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}