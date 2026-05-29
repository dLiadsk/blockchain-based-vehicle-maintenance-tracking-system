import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Card, CardContent, Chip, CircularProgress, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BuildIcon from '@mui/icons-material/Build';
import api from '../services/api';

export default function VehicleDetails() {
    const { vin } = useParams<{ vin: string }>();
    const navigate = useNavigate();

    const [vehicle, setVehicle] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchVehicleData = async () => {
            try {
                // Завантажуємо дані авто
                const vehicleRes = await api.get(`/vehicles/${vin}`);
                setVehicle(vehicleRes.data);

                // Завантажуємо історію обслуговування
                const historyRes = await api.get(`/vehicles/${vin}/history`);
                setHistory(historyRes.data);
            } catch (err) {
                console.error(err);
                setError('Не вдалося завантажити дані автомобіля. Перевірте правильність VIN-коду.');
            } finally {
                setLoading(false);
            }
        };

        if (vin) fetchVehicleData();
    }, [vin]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ mt: 4, mx: 'auto', maxWidth: 600 }}>{error}</Alert>;
    if (!vehicle) return <Alert severity="warning" sx={{ mt: 4, mx: 'auto', maxWidth: 600 }}>Автомобіль не знайдено</Alert>;

    return (
        <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 4, px: 3, pb: 6 }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/driver')}
                sx={{ mb: 3 }}
            >
                Повернутися до Гаража
            </Button>

            {/* Блок даних автомобіля */}
            <Card elevation={3} sx={{ borderRadius: 2, mb: 4, overflow: 'visible' }}>
                <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 3, borderTopLeftRadius: 8, borderTopRightRadius: 8, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <DirectionsCarIcon fontSize="large" />
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {vehicle.brand} {vehicle.model}
                        </Typography>
                        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                            Рік: {vehicle.year} • {vehicle.vehicleType}
                        </Typography>
                    </Box>
                </Box>
                <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                        <Box>
                            <Typography variant="body2" color="text.secondary">VIN Код</Typography>
                            <Typography variant="h6" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>{vehicle.vin}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">Державний номер</Typography>
                            <Typography variant="h6">{vehicle.number || 'Не вказано'}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">Поточний пробіг</Typography>
                            <Typography variant="h6">{vehicle.mileage} км</Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">Блокчейн Хеш (Реєстрація)</Typography>
                            <Typography variant="body2" sx={{ wordBreak: 'break-all', color: 'primary.main', fontFamily: 'monospace' }}>
                                {vehicle.blockchainTxHash || 'Очікує підтвердження мережею'}
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Блок історії обслуговування */}
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BuildIcon color="action" /> Історія обслуговування ({history.length})
            </Typography>

            {history.length === 0 ? (
                <Alert severity="info">Цей автомобіль ще не має історії ремонтів у системі.</Alert>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {history.map((req) => (
                        <Card key={req.id} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 2, bgcolor: 'grey.50', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                    Заявка #{req.id} • {new Date(req.createdAt).toLocaleDateString('uk-UA')}
                                </Typography>
                                <Chip
                                    label={req.status}
                                    color={req.status === 'COMPLETED' ? 'success' : req.status === 'PENDING' ? 'warning' : 'primary'}
                                    size="small"
                                />
                            </Box>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>Опис проблеми:</Typography>
                                        <Typography variant="body1" sx={{ mb: 2 }}>{req.description || 'Без опису'}</Typography>

                                        <Typography variant="body2" color="text.secondary" gutterBottom>Виконані роботи:</Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {req.workTypes?.map((work: string, i: number) => (
                                                <Chip key={i} label={work} variant="outlined" size="small" />
                                            )) || <Typography variant="body2">Не призначено</Typography>}
                                        </Box>
                                    </Box>
                                    <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                                        <Typography variant="body2" color="text.secondary">Вартість ремонту</Typography>
                                        <Typography variant="h6" sx={{ color: 'success.main', mb: 2 }}>{req.totalAmount || 0} UAH</Typography>

                                        <Typography variant="body2" color="text.secondary">Blockchain Job ID</Typography>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                            {req.blockchainJobId || 'Очікує створення смарт-контракту'}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}
        </Box>
    );
}