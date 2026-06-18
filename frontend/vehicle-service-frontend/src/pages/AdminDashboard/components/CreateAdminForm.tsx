import React, { useState, useEffect, type JSX } from 'react';
import { Paper, Typography, Box, Grid, TextField, Autocomplete, Button, Snackbar, Alert } from '@mui/material';
import api from '../../../services/api';
import type {StoProfile, NotificationState} from '../../../types';

/**
 * Component for registering a new STO Administrator account.
 * Allows assigning a newly created admin to an existing Service Station.
 */
export default function CreateAdminForm(): JSX.Element {
    const [formData, setFormData] = useState({
        email: '', password: '', firstName: '', lastName: '', phoneNumber: ''
    });

    const [stos, setStos] = useState<StoProfile[]>([]);
    const [selectedSto, setSelectedSto] = useState<StoProfile | null>(null);
    const [notification, setNotification] = useState<NotificationState | null>(null);

    // Fetch available STOs when component mounts
    useEffect(() => {
        const fetchStos = async () => {
            try {
                const response = await api.get<StoProfile[]>('/stos');
                setStos(response.data);
            } catch (error) {
                console.error("Failed to fetch STOs:", error);
                setNotification({ text: 'Не вдалося завантажити список станцій', type: 'error' });
            }
        };

        void fetchStos();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        if (!selectedSto) {
            setNotification({ text: 'Будь ласка, оберіть СТО зі списку', type: 'error' });
            return;
        }

        try {
            const payload = { ...formData, stoId: selectedSto.id };
            await api.post('/admin/register-sto-admin', payload);

            setNotification({ text: 'Менеджера СТО успішно зареєстровано!', type: 'success' });

            // Reset form upon success
            setFormData({ email: '', password: '', firstName: '', lastName: '', phoneNumber: '' });
            setSelectedSto(null);
        } catch (error) {
            console.error('Registration failed:', error);
            setNotification({ text: 'Помилка реєстрації. Можливо, email вже існує.', type: 'error' });
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>Реєстрація адміністратора СТО</Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="Ім'я" name="firstName" value={formData.firstName} onChange={handleChange} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="Прізвище" name="lastName" value={formData.lastName} onChange={handleChange} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="Email адреса" type="email" name="email" value={formData.email} onChange={handleChange} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="Номер телефону" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="+380..." />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="Пароль" type="password" name="password" value={formData.password} onChange={handleChange} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Autocomplete
                            options={stos}
                            getOptionLabel={(option) => `${option.stationName} (${option.city})`}
                            value={selectedSto}
                            onChange={(_, newValue) => setSelectedSto(newValue)}
                            renderInput={(params) => (
                                <TextField {...params} label="Оберіть СТО" required placeholder="Почніть вводити назву..." />
                            )}
                            noOptionsText="СТО не знайдено"
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Button type="submit" variant="contained" size="large" fullWidth>Зареєструвати менеджера</Button>
                    </Grid>
                </Grid>
            </Box>

            <Snackbar open={!!notification} autoHideDuration={6000} onClose={() => setNotification(null)}>
                <Alert onClose={() => setNotification(null)} severity={notification?.type} sx={{ width: '100%' }}>
                    {notification?.text}
                </Alert>
            </Snackbar>
        </Paper>
    );
}