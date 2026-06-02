import React, { useState, type JSX } from 'react';
import { Paper, Typography, Box, Grid, TextField, Autocomplete, Chip, Button, Snackbar, Alert } from '@mui/material';
import api from '../../../services/api';
import type { NotificationState } from '../../../types';

/**
 * Component for registering a new Service Station (STO).
 */
export default function CreateStoForm(): JSX.Element {
    const [formData, setFormData] = useState({
        stationName: '', region: '', city: '', address: '', description: ''
    });
    const [serviceTypes, setServiceTypes] = useState<string[]>([]);
    const [notification, setNotification] = useState<NotificationState | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        const payload = { ...formData, serviceTypes };

        try {
            await api.post('/admin/create-sto-profile', payload);
            setNotification({ text: 'Профіль СТО успішно створено!', type: 'success' });
            setFormData({ stationName: '', region: '', city: '', address: '', description: '' });
            setServiceTypes([]);
        } catch (error) {
            console.error('Failed to create STO:', error);
            setNotification({ text: 'Помилка при створенні СТО. Перевірте консоль.', type: 'error' });
        }
    };

    const suggestedServices = [
        'Комп\'ютерна діагностика', 'Заміна мастила', 'Ремонт двигуна',
        'Шиномонтаж', 'Ремонт ходової', 'Автоелектрик', 'Розвал-сходження'
    ];

    return (
        <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>Реєстрація нової СТО</Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="Назва станції" name="stationName" value={formData.stationName} onChange={handleChange} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="Область / Регіон" name="region" value={formData.region} onChange={handleChange} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="Місто" name="city" value={formData.city} onChange={handleChange} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="Адреса" name="address" value={formData.address} onChange={handleChange} />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Autocomplete
                            {...({
                                multiple: true,
                                freeSolo: true,
                                options: suggestedServices,
                                value: serviceTypes,
                                onChange: (_event: React.SyntheticEvent, newValue: string[]) => {
                                    setServiceTypes(newValue);
                                },
                                renderTags: (value: string[], getTagProps: (arg: { index: number }) => any) =>
                                    value.map((option: string, index: number) => {
                                        const { key, ...tagProps } = getTagProps({ index });
                                        return (
                                            <Chip key={key} variant="filled" color="primary" label={option} {...tagProps} />
                                        );
                                    }),
                                renderInput: (params: any) => (
                                    <TextField {...params} variant="outlined" label="Види послуг" placeholder="Оберіть зі списку або введіть свою та натисніть Enter" />
                                )
                            } as any)}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField fullWidth multiline rows={4} label="Опис станції" name="description" value={formData.description} onChange={handleChange} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Button type="submit" variant="contained" size="large" fullWidth>Створити СТО</Button>
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