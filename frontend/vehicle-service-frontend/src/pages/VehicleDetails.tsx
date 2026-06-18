import { useEffect, useState, type JSX } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Card, CardContent, Chip,
    CircularProgress, Alert, Grid
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BuildIcon from '@mui/icons-material/Build';
import LaunchIcon from '@mui/icons-material/Launch';

import api from '../services/api';
import type { Vehicle, ServiceRequest } from '../types';

// ============================================================================
// TYPES
// ============================================================================

type ChipColor = "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Displays detailed information about a specific vehicle owned by the driver,
 * including its specifications, blockchain registration hash, and a complete
 * history of associated service requests.
 */
export default function VehicleDetails(): JSX.Element {
    const { vin } = useParams<{ vin: string }>();
    const navigate = useNavigate();

    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [history, setHistory] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const fetchVehicleData = async () => {
            try {
                // Fetch vehicle specifications
                const vehicleRes = await api.get<Vehicle>(`/vehicles/${vin}`);
                setVehicle(vehicleRes.data);

                // Fetch full service history for this vehicle
                const historyRes = await api.get<ServiceRequest[]>(`/vehicles/${vin}/history`);
                setHistory(historyRes.data);
            } catch (err) {
                console.error("Failed to fetch vehicle data:", err);
                setError('Не вдалося завантажити дані автомобіля. Перевірте правильність VIN-коду.');
            } finally {
                setLoading(false);
            }
        };

        if (vin) {
            void fetchVehicleData();
        }
    }, [vin]);

    /**
     * Determines the appropriate Material-UI color for a given request status.
     */
    const getStatusColor = (status: string): ChipColor => {
        switch (status) {
            case 'RequestCreated':
            case 'AcceptedByAdmin':
            case 'VehicleArrived': return 'warning';
            case 'Inspected': return 'secondary';
            case 'DepositPaid':
            case 'ReadyForRepair':
            case 'WorkInProgress': return 'info';
            case 'ReadyForPickup':
            case 'Finalized': return 'success';
            case 'Canceled': return 'error';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ mt: 4, mx: 'auto', maxWidth: 600 }}>{error}</Alert>;
    }

    if (!vehicle) {
        return <Alert severity="warning" sx={{ mt: 4, mx: 'auto', maxWidth: 600 }}>Автомобіль не знайдено</Alert>;
    }

    return (
        <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 4, px: 3, pb: 6 }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/driver')}
                sx={{ mb: 3 }}
            >
                Повернутися до Гаража
            </Button>

            {/* Vehicle Specifications Card */}
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
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" color="text.secondary">VIN Код</Typography>
                            <Typography variant="h6" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>{vehicle.vin}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" color="text.secondary">Державний номер</Typography>
                            <Typography variant="h6">{vehicle.number || 'Не вказано'}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" color="text.secondary">Поточний пробіг</Typography>
                            <Typography variant="h6">{vehicle.mileage} км</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" color="text.secondary">Блокчейн Хеш (Реєстрація)</Typography>
                            <Typography variant="body2" sx={{ wordBreak: 'break-all', color: 'primary.main', fontFamily: 'monospace' }}>
                                {vehicle.blockchainTxHash || 'Очікує підтвердження мережею'}
                            </Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Service History Section */}
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BuildIcon color="action" /> Історія обслуговування ({history.length})
            </Typography>

            {history.length === 0 ? (
                <Alert severity="info">Цей автомобіль ще не має історії ремонтів у системі.</Alert>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {history.map((req) => (
                        <Card key={req.id} variant="outlined" sx={{ borderRadius: 2 }}>
                            {/* Request Header */}
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 2, bgcolor: 'grey.50', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                        Заявка #{req.id}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {new Date(req.createdAt).toLocaleDateString('uk-UA')}
                                    </Typography>
                                    <Chip
                                        label={req.status}
                                        color={getStatusColor(req.status)}
                                        size="small"
                                        sx={{ fontWeight: 'bold' }}
                                    />
                                </Box>
                                <Button
                                    variant="contained"
                                    size="small"
                                    endIcon={<LaunchIcon />}
                                    onClick={() => navigate(`/requests/${req.id}`)}
                                >
                                    Відкрити заявку
                                </Button>
                            </Box>

                            {/* Request Details */}
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>Опис проблеми:</Typography>
                                        <Typography variant="body1" sx={{ mb: 2 }}>{req.description || 'Без опису'}</Typography>

                                        <Typography variant="body2" color="text.secondary" gutterBottom>Послуги / Роботи:</Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {req.workTypes && req.workTypes.length > 0 ? req.workTypes.map((work: string, i: number) => (
                                                <Chip key={i} label={work} variant="outlined" size="small" />
                                            )) : <Typography variant="body2">Не призначено</Typography>}
                                        </Box>
                                    </Box>
                                    <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                                        <Typography variant="body2" color="text.secondary">Загальна вартість</Typography>
                                        <Typography variant="h6" sx={{ color: 'success.main', mb: 2 }}>
                                            {req.totalAmount ? `${req.totalAmount} UAH` : 'Очікує оцінки'}
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary">Blockchain Job ID</Typography>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                            {req.blockchainJobId || 'Очікує смарт-контракт'}
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