import React, { useEffect, useState, type JSX } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Card, CardContent, Chip, CircularProgress,
    Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Autocomplete, Snackbar, Grid
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StorefrontIcon from '@mui/icons-material/Storefront';

import api from '../services/api';
import type { StoProfile, Vehicle, NotificationState } from '../types';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Displays detailed information about a specific Service Station (STO)
 * and provides a modal form for users to book an appointment (create a service request).
 */
export default function StoDetails(): JSX.Element {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Data State
    const [sto, setSto] = useState<StoProfile | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Modal & Form State
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [notification, setNotification] = useState<NotificationState | null>(null);
    const [requestForm, setRequestForm] = useState({
        vin: '',
        mileage: '',
        description: '',
        selectedWorkTypes: [] as string[]
    });

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // Fetch STO Details
                const stoResponse = await api.get<StoProfile[]>('/stos');
                const foundSto = stoResponse.data.find(s => s.id === Number(id));
                setSto(foundSto || null);

                // Fetch User's Vehicles for the booking form
                const vehicleResponse = await api.get<Vehicle[]>('/vehicles/my');
                setVehicles(vehicleResponse.data);
            } catch (err) {
                console.error("Failed to load STO details or vehicles:", err);
            } finally {
                setLoading(false);
            }
        };

        void fetchDetails();
    }, [id]);

    const handleCreateRequest = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        if (!requestForm.vin) {
            setNotification({ text: 'Будь ласка, оберіть ваш автомобіль', type: 'error' });
            return;
        }

        if (!sto?.id) {
            setNotification({ text: 'Помилка: Неможливо визначити ID станції', type: 'error' });
            return;
        }

        try {
            const payload = {
                vin: requestForm.vin,
                stoId: sto.id,
                mileage: Number(requestForm.mileage) || 0,
                description: requestForm.description,
                workTypes: requestForm.selectedWorkTypes
            };

            await api.post('/service-requests/create', payload);

            setNotification({ text: 'Заявку успішно відправлено на СТО!', type: 'success' });
            setOpenModal(false);
            setRequestForm({ vin: '', mileage: '', description: '', selectedWorkTypes: [] });
        } catch (error) {
            console.error('Failed to create booking request:', error);
            setNotification({ text: 'Помилка при створенні заявки', type: 'error' });
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!sto) {
        return (
            <Alert severity="warning" sx={{ mt: 4, mx: 'auto', maxWidth: 600 }}>
                СТО не знайдено
            </Alert>
        );
    }

    return (
        <Box sx={{ width: '100%', maxWidth: 1000, mx: 'auto', mt: 4, px: 3, pb: 6 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/sto-catalog')} sx={{ mb: 3 }}>
                Повернутися до Каталогу
            </Button>

            <Card elevation={3} sx={{
                width: '100%',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                mb: 4,
                overflow: 'visible'
            }}>
                {/* Card Header */}
                <Box sx={{ bgcolor: 'secondary.main', color: 'white', p: 3, borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <StorefrontIcon fontSize="large" />
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{sto.stationName}</Typography>
                            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>{sto.city}, {sto.address}</Typography>
                        </Box>
                    </Box>

                    <Button variant="contained" color="primary" size="large" onClick={() => setOpenModal(true)} sx={{ bgcolor: 'white', color: 'secondary.main', '&:hover': { bgcolor: 'grey.100' } }}>
                        Записатися на СТО
                    </Button>
                </Box>

                {/* Card Body */}
                <CardContent sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="body1" sx={{ mb: 4, color: 'text.primary', fontSize: '1.1rem' }}>
                        {sto.description || 'СТО ще не додало детальний опис.'}
                    </Typography>

                    <Box sx={{ mt: 'auto' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Доступні послуги:</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {sto.serviceTypes && sto.serviceTypes.length > 0 ? (
                                sto.serviceTypes.map((srv: string, i: number) => (
                                    <Chip key={i} label={srv} color="info" variant="outlined" sx={{ fontSize: '1rem', p: 1 }} />
                                ))
                            ) : (
                                <Typography variant="body1" color="text.secondary">СТО ще не додало список послуг.</Typography>
                            )}
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Booking Modal */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Запис на СТО: {sto.stationName}</DialogTitle>
                <DialogContent dividers>
                    <Box component="form" id="sto-request-form" onSubmit={handleCreateRequest}>
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            <Grid size={{ xs: 12 }}>
                                <Autocomplete
                                    options={vehicles}
                                    getOptionLabel={(option) => `${option.brand} ${option.model} (${option.number || option.vin})`}
                                    onChange={(_, newValue) => setRequestForm({ ...requestForm, vin: newValue ? newValue.vin : '' })}
                                    renderInput={(params) => <TextField {...params} required label="Оберіть ваш автомобіль" />}
                                    noOptionsText="У вас ще немає авто. Додайте його в Гаражі."
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    required
                                    variant="outlined"
                                    type="number"
                                    label="Поточний пробіг авто (км)"
                                    value={requestForm.mileage}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const val = e.target.value;
                                        // Block negative numbers
                                        if (Number(val) < 0) return;
                                        setRequestForm({ ...requestForm, mileage: val });
                                    }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Autocomplete
                                    multiple
                                    options={sto.serviceTypes || []}
                                    value={requestForm.selectedWorkTypes}
                                    onChange={(_, newValue) => setRequestForm({ ...requestForm, selectedWorkTypes: newValue })}
                                    renderInput={(params) => <TextField {...params} label="Які роботи потрібні?" placeholder="Оберіть послуги" />}
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    required
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Опис проблеми"
                                    value={requestForm.description}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRequestForm({ ...requestForm, description: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenModal(false)} size="large">Скасувати</Button>
                    <Button type="submit" form="sto-request-form" variant="contained" size="large">Відправити заявку</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!notification} autoHideDuration={6000} onClose={() => setNotification(null)}>
                <Alert onClose={() => setNotification(null)} severity={notification?.type} sx={{ width: '100%' }}>
                    {notification?.text}
                </Alert>
            </Snackbar>
        </Box>
    );
}