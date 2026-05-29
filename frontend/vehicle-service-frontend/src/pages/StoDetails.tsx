import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Card, CardContent, Chip, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete, Snackbar, Grid } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StorefrontIcon from '@mui/icons-material/Storefront';
import api from '../services/api';

export default function StoDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [sto, setSto] = useState<any>(null);
    const [vehicles, setVehicles] = useState<any[]>([]); // Автомобілі користувача
    const [loading, setLoading] = useState(true);

    // Стейт для модалки створення заявки
    const [openModal, setOpenModal] = useState(false);
    const [notification, setNotification] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [requestForm, setRequestForm] = useState({
        vin: '',
        description: '',
        selectedWorkTypes: [] as string[]
    });

    useEffect(() => {
        // Оскільки в нас може не бути окремого ендпоінту GET /stos/{id},
        // безпечніше завантажити всі і знайти потрібне (або заміни на api.get(`/stos/${id}`) якщо такий є)
        api.get('/stos').then(res => {
            const foundSto = res.data.find((s: any) => s.id === Number(id));
            setSto(foundSto);
            setLoading(false);
        }).catch(() => setLoading(false));

        // Одразу вантажимо авто користувача для випадаючого списку в модалці
        api.get('/vehicles/my').then(res => setVehicles(res.data)).catch(console.error);
    }, [id]);

    const handleCreateRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!requestForm.vin) {
            setNotification({ text: 'Будь ласка, оберіть ваш автомобіль', type: 'error' });
            return;
        }

        try {
            const payload = {
                vin: requestForm.vin,
                stoId: sto.id,
                description: requestForm.description,
                workTypes: requestForm.selectedWorkTypes
            };

            await api.post('/service-requests/create', payload);
            setNotification({ text: 'Заявку успішно відправлено на СТО!', type: 'success' });
            setOpenModal(false);
            setRequestForm({ vin: '', description: '', selectedWorkTypes: [] });
        } catch (error) {
            console.error(error);
            setNotification({ text: 'Помилка при створенні заявки', type: 'error' });
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
    if (!sto) return <Alert severity="warning" sx={{ mt: 4, mx: 'auto', maxWidth: 600 }}>СТО не знайдено</Alert>;

    return (
        <Box sx={{ width: '100%', maxWidth: 1000, mx: 'auto', mt: 4, px: 3, pb: 6 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/sto-catalog')} sx={{ mb: 3 }}>
                Повернутися до Каталогу
            </Button>

            <Card elevation={3} sx={{
                width: '100%',
                minHeight: '400px', /* Гарантуємо однакову мінімальну висоту */
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                mb: 4,
                overflow: 'visible'
            }}>
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

                {/* flexGrow: 1 дозволяє контенту зайняти весь вільний простір картки */}
                <CardContent sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="body1" sx={{ mb: 4, color: 'text.primary', fontSize: '1.1rem' }}>
                        {sto.description || 'СТО ще не додало детальний опис.'}
                    </Typography>

                    {/* mt: 'auto' відштовхує цей блок у самий низ картки */}
                    <Box sx={{ mt: 'auto' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Доступні послуги:</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {sto.serviceTypes?.length > 0 ? (
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

            {/* Модалка створення заявки */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Запис на СТО: {sto.stationName}</DialogTitle>
                <DialogContent dividers>
                    <Box component="form" id="sto-request-form" onSubmit={handleCreateRequest}>
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            <Grid size={{ xs: 12 }}>
                                <Autocomplete
                                    options={vehicles}
                                    getOptionLabel={(option) => `${option.brand} ${option.model} (${option.licensePlate || option.vin})`}
                                    onChange={(_, newValue) => setRequestForm({ ...requestForm, vin: newValue ? newValue.vin : '' })}
                                    renderInput={(params) => <TextField {...params} required label="Оберіть ваш автомобіль" />}
                                    noOptionsText="У вас ще немає авто. Додайте його в Гаражі."
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
                                    required fullWidth multiline rows={4}
                                    label="Опис проблеми"
                                    value={requestForm.description}
                                    onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
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