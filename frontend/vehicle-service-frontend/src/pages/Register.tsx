import { useState } from 'react';
import { Box, Button, TextField, Typography, Container, Paper, Alert, Grid, Link } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import api from '../services/api';

export default function Register() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        try {
            // Відправляємо запит на реєстрацію звичайного користувача (ROLE_USER)
            await api.post('/auth/register', formData);

            setSuccess(true);
            // Через 2 секунди перенаправляємо на сторінку входу
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Помилка реєстрації. Можливо, такий email вже існує.');
        }
    };

    return (
        <Container component="main" maxWidth="sm">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
                    <Typography component="h1" variant="h5" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
                        Створення акаунту
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 2 }}>Реєстрація успішна! Перенаправлення на вхід...</Alert>}

                    <Box component="form" onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField required fullWidth label="Ім'я" name="firstName" value={formData.firstName} onChange={handleChange} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField required fullWidth label="Прізвище" name="lastName" value={formData.lastName} onChange={handleChange} />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField required fullWidth label="Email адреса" type="email" name="email" value={formData.email} onChange={handleChange} />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField required fullWidth label="Номер телефону" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="+380..." />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField required fullWidth label="Пароль" type="password" name="password" value={formData.password} onChange={handleChange} />
                            </Grid>
                        </Grid>

                        <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 4, mb: 2 }} disabled={success}>
                            Зареєструватися
                        </Button>

                        <Box sx={{ textAlign: 'center' }}>
                            <Link component={RouterLink} to="/login" variant="body2">
                                Вже є акаунт? Увійти
                            </Link>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}