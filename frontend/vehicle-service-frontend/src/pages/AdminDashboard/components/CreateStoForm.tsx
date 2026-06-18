import React, { useState, type JSX } from 'react';
import {
    Paper, Typography, Box, Grid, TextField, Autocomplete,
    Chip, Button, Snackbar, Alert, MenuItem
} from '@mui/material';
import api from '../../../services/api';
import type { NotificationState } from '../../../types';

// ============================================================================
// CONSTANTS
// ============================================================================

const UKRAINIAN_REGIONS = [
    'Автономна Республіка Крим',
    'Вінницька область',
    'Волинська область',
    'Дніпропетровська область',
    'Донецька область',
    'Житомирська область',
    'Закарпатська область',
    'Запорізька область',
    'Івано-Франківська область',
    'Київська область',
    'Кіровоградська область',
    'Луганська область',
    'Львівська область',
    'Миколаївська область',
    'Одеська область',
    'Полтавська область',
    'Рівненська область',
    'Сумська область',
    'Тернопільська область',
    'Харківська область',
    'Херсонська область',
    'Хмельницька область',
    'Черкаська область',
    'Чернівецька область',
    'Чернігівська область',
    'м. Київ',
    'м. Севастополь'
];

const SUGGESTED_SERVICES = [
    'Комп\'ютерна діагностика', 'Заміна мастила', 'Ремонт двигуна',
    'Шиномонтаж', 'Ремонт ходової', 'Автоелектрик', 'Розвал-сходження'
];

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Component for registering a new Service Station (STO) by an Administrator.
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
            // Reset form
            setFormData({ stationName: '', region: '', city: '', address: '', description: '' });
            setServiceTypes([]);
        } catch (error) {
            console.error('Failed to create STO:', error);
            setNotification({ text: 'Помилка при створенні СТО. Перевірте консоль.', type: 'error' });
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>Реєстрація нової СТО</Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth required label="Назва станції" name="stationName"
                            value={formData.stationName} onChange={handleChange}
                        />
                    </Grid>

                    {/* Updated Field: Dropdown for Regions */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            select fullWidth required label="Область / Регіон" name="region"
                            value={formData.region} onChange={handleChange}
                        >
                            {UKRAINIAN_REGIONS.map((region) => (
                                <MenuItem key={region} value={region}>
                                    {region}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth required label="Місто" name="city"
                            value={formData.city} onChange={handleChange}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth required label="Адреса" name="address"
                            value={formData.address} onChange={handleChange}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        {/* Workaround for MUI Autocomplete complex type conflicts when combining `multiple` and `freeSolo`.
                          The component is forcefully cast to `any` to prevent TS compilation errors.
                        */}
                        <Autocomplete
                            {...({
                                multiple: true,
                                freeSolo: true,
                                options: SUGGESTED_SERVICES,
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
                        <TextField
                            fullWidth multiline rows={4} label="Опис станції" name="description"
                            value={formData.description} onChange={handleChange}
                        />
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