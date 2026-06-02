import { useState, useEffect, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Card, CardContent,
    TextField, Alert, Snackbar
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';

import api from '../../services/api';
import type { Vehicle, StoProfile, NotificationState } from '../../types';

// Імпортуємо наші нові чисті компоненти
import AddVehicleModal from './components/AddVehicleModal';
import CreateRequestModal from './components/CreateRequestModal';

/**
 * Main dashboard for drivers.
 * Displays the user's garage, provides search functionality, and integrates modals for adding vehicles and creating service requests.
 */
export default function DriverDashboard(): JSX.Element {
    const navigate = useNavigate();

    // Global State
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [stos, setStos] = useState<StoProfile[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [notification, setNotification] = useState<NotificationState | null>(null);

    // Modal State
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openRequestModal, setOpenRequestModal] = useState<boolean>(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

    /**
     * Fetches the current user's registered vehicles.
     */
    const fetchMyVehicles = async () => {
        try {
            const response = await api.get<Vehicle[]>('/vehicles/my');
            setVehicles(response.data);
        } catch (error) {
            console.error("Помилка завантаження авто:", error);
            showError('Не вдалося завантажити список автомобілів.');
        }
    };

    /**
     * Fetches all available STOs for the request creation modal.
     */
    const fetchStos = async () => {
        try {
            const response = await api.get<StoProfile[]>('/stos');
            setStos(response.data);
        } catch (error) {
            console.error("Помилка завантаження СТО:", error);
        }
    };

    // Load initial data on mount
    useEffect(() => {
        void fetchMyVehicles();
        void fetchStos();
    }, []);

    // Filter vehicles based on search query (Brand, Model, or VIN)
    const filteredVehicles = vehicles.filter(vehicle =>
        vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.vin.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Notification Helpers
    const showSuccess = (message: string) => {
        setNotification({ text: message, type: 'success' });
        void fetchMyVehicles(); // Refresh garage after success
    };

    const showError = (message: string) => {
        setNotification({ text: message, type: 'error' });
    };

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, px: 3 }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 2, fontWeight: 'bold' }}>
                    <DirectionsCarIcon fontSize="large" color="primary" />
                    Мій Гараж
                </Typography>

                <TextField
                    size="small"
                    label="Пошук авто..."
                    placeholder="Марка, модель або VIN"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ maxWidth: 300, bgcolor: 'white' }}
                />

                <Button
                    variant="contained"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={() => setOpenAddModal(true)}
                >
                    Додати авто
                </Button>
            </Box>

            {/* Garage Content Section */}
            {vehicles.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                    У вас ще немає доданих автомобілів. Натисніть "Додати авто", щоб почати.
                </Alert>
            ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                    {filteredVehicles.map((vehicle) => (
                        <Card key={vehicle.id} elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
                            <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                    {vehicle.brand} {vehicle.model}
                                </Typography>

                                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Typography variant="body1"><strong>Рік:</strong> {vehicle.year}</Typography>
                                    <Typography variant="body1" sx={{ wordBreak: 'break-all' }}><strong>VIN:</strong> {vehicle.vin}</Typography>
                                    <Typography variant="body1"><strong>Держ. номер:</strong> {vehicle.number}</Typography>
                                    <Typography variant="body1"><strong>Пробіг:</strong> {vehicle.mileage} км</Typography>
                                </Box>
                            </CardContent>

                            <Box sx={{ p: 3, pt: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="info"
                                    onClick={() => navigate(`/vehicle/${vehicle.vin}`)}
                                >
                                    Деталі та Історія
                                </Button>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => {
                                        setSelectedVehicle(vehicle);
                                        setOpenRequestModal(true);
                                    }}
                                >
                                    Створити заявку на СТО
                                </Button>
                            </Box>
                        </Card>
                    ))}
                </Box>
            )}

            {/* Extracted Modals */}
            <AddVehicleModal
                open={openAddModal}
                onClose={() => setOpenAddModal(false)}
                onSuccess={showSuccess}
                onError={showError}
            />

            <CreateRequestModal
                open={openRequestModal}
                onClose={() => setOpenRequestModal(false)}
                selectedVehicle={selectedVehicle}
                stos={stos}
                onSuccess={showSuccess}
                onError={showError}
            />

            {/* Global Snackbar for Dashboard Notifications */}
            <Snackbar open={!!notification} autoHideDuration={6000} onClose={() => setNotification(null)}>
                <Alert onClose={() => setNotification(null)} severity={notification?.type} sx={{ width: '100%' }}>
                    {notification?.text}
                </Alert>
            </Snackbar>
        </Box>
    );
}