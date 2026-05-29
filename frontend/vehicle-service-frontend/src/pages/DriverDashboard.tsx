import {useState, useEffect} from 'react';
import {
    Box, Typography, Button, Grid, Card, CardContent,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Snackbar, Autocomplete
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import api from '../services/api';
import {useNavigate} from 'react-router-dom';

const VEHICLE_TYPES = [
    'Седан', 'Хетчбек', 'Універсал', 'Кросовер',
    'Позашляховик', 'Мінівен', 'Купе', 'Пікап', 'Фургон'
];

const CAR_DATA: Record<string, string[]> = {
    'Fiat': ['Linea', '500', 'Doblo', 'Punto', 'Tipo'],
    'Volkswagen': ['T5', 'Golf', 'Passat', 'Tiguan', 'Touareg', 'Polo'],
    'Toyota': ['Camry', 'Corolla', 'RAV4', 'Land Cruiser'],
    'BMW': ['3 Series', '5 Series', 'X3', 'X5'],
    'Audi': ['A4', 'A6', 'Q5', 'Q7'],
    'Renault': ['Megane', 'Clio', 'Duster', 'Logan'],
    'Skoda': ['Octavia', 'Superb', 'Kodiaq', 'Fabia'],
    // За потреби сюди можна додати більше
};

const BRANDS = Object.keys(CAR_DATA);


export default function DriverDashboard() {
    const navigate = useNavigate();
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [openAddModal, setOpenAddModal] = useState(false);
    const [formData, setFormData] = useState({
        vin: '', brand: '', model: '', year: '', vehicleType: '', number: '', mileage: ''
    });
    const [notification, setNotification] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const [stos, setStos] = useState<any[]>([]);
    const [openRequestModal, setOpenRequestModal] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);

    const [selectedCity, setSelectedCity] = useState<string | null>(null);

    const [requestForm, setRequestForm] = useState({
        stoId: null as number | null,
        description: '',
        selectedWorkTypes: [] as string[] // Додаємо масив для вибраних робіт
    });
    const [searchQuery, setSearchQuery] = useState('');
    const filteredVehicles = vehicles.filter(vehicle =>
        vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.vin.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 1. Отримуємо унікальний список міст з усіх СТО
    const availableCities = Array.from(new Set(stos.map(sto => sto.city).filter(Boolean)));

    // 2. Фільтруємо СТО на основі вибраного міста ТА вибраних послуг
    const filteredStos = stos.filter(sto => {
        const matchCity = selectedCity ? sto.city === selectedCity : true;
        // Перевіряємо, чи має СТО всі послуги, які обрав користувач
        const matchServices = requestForm.selectedWorkTypes.length > 0
            ? requestForm.selectedWorkTypes.every(work => sto.serviceTypes?.includes(work))
            : true;

        return matchCity && matchServices;
    });

    // 3. Динамічний список послуг
    // Якщо СТО ВЖЕ обрано -> показуємо тільки послуги цього СТО
    // Якщо СТО НЕ обрано -> показуємо всі унікальні послуги з відфільтрованих СТО
    const availableServices = requestForm.stoId
        ? (stos.find(s => s.id === requestForm.stoId)?.serviceTypes || [])
        : Array.from(new Set(filteredStos.flatMap(sto => sto.serviceTypes || [])));


    // Завантаження авто поточного користувача
    const fetchMyVehicles = async () => {
        try {
            const response = await api.get('/vehicles/my');
            setVehicles(response.data);
        } catch (error) {
            console.error("Помилка завантаження авто:", error);
        }
    };

    useEffect(() => {
        fetchMyVehicles();

        // Перевір, чи є цей рядок:
        api.get('/stos')
            .then(res => setStos(res.data))
            .catch(err => console.error("Помилка завантаження СТО:", err));
    }, []);

    const handleCreateRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!requestForm.stoId) {
            setNotification({text: 'Будь ласка, оберіть СТО', type: 'error'});
            return;
        }

        try {
            const payload = {
                vin: selectedVehicle.vin,
                stoId: requestForm.stoId,
                description: requestForm.description,
                workTypes: requestForm.selectedWorkTypes // Передаємо вибрані роботи
            };

            await api.post('/service-requests/create', payload);
            setNotification({text: 'Заявку успішно створено!', type: 'success'});
            setOpenRequestModal(false);

            // ОЧИЩАЄМО ВСІ ФІЛЬТРИ ПІСЛЯ УСПІХУ
            setRequestForm({stoId: null, description: '', selectedWorkTypes: []});
            setSelectedCity(null);
            setSelectedVehicle(null);
        } catch (error) {
            console.error(error);
            setNotification({text: 'Помилка при створенні заявки', type: 'error'});
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({...formData, [e.target.name]: e.target.value});
    };
// Обробник для VIN-коду (тільки латиниця і цифри, максимум 17 символів, завжди великі)
    const handleVinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.toUpperCase();
        // Видаляємо всі не-латинські та не-цифрові символи
        const sanitizedValue = rawValue.replace(/[^A-Z0-9]/g, '').slice(0, 17);
        setFormData({...formData, vin: sanitizedValue});
    };

    // Обробник для Держномера (тільки латиниця, цифри та дефіс, максимум 10 символів)
    const handleLicensePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.toUpperCase();
        const sanitizedValue = rawValue.replace(/[^A-Z0-9-]/g, '').slice(0, 10);
        setFormData({...formData, number: sanitizedValue});
    };
    // Стейт для зберігання помилок валідації
    const [formErrors, setFormErrors] = useState({vin: '', year: ''});

    // Оновлена функція з валідацією
    const handleAddVehicle = async (e: React.FormEvent) => {
        e.preventDefault();

        // Скидаємо попередні помилки
        let isValid = true;
        const errors = {vin: '', year: ''};

        // Валідація VIN-коду (має бути рівно 17 символів, тільки букви та цифри)
        const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
        if (!vinRegex.test(formData.vin)) {
            errors.vin = 'VIN код має складатись із 17 символів (без I, O, Q)';
            isValid = false;
        }

        // Валідація року (не раніше 1900 і не пізніше наступного року)
        const currentYear = new Date().getFullYear();
        const yearNum = parseInt(formData.year, 10);
        if (yearNum < 1900 || yearNum > currentYear) {
            errors.year = `Рік має бути від 1900 до ${currentYear}`;
            isValid = false;
        }

        setFormErrors(errors);

        if (!isValid) {
            setNotification({text: 'Будь ласка, виправте помилки у формі', type: 'error'});
            return;
        }

        try {
            const payload = {
                ...formData,
                year: yearNum,
                mileage: parseInt(formData.mileage, 10)
            };

            await api.post('/vehicles/register', payload);
            setNotification({text: 'Автомобіль успішно додано!', type: 'success'});
            setOpenAddModal(false);
            setFormData({vin: '', brand: '', model: '', year: '', vehicleType: '', number: '', mileage: ''});
            fetchMyVehicles();
        } catch (error) {
            console.error(error);
            setNotification({text: 'Помилка при додаванні авто. Перевірте дані.', type: 'error'});
        }
    };

    return (
        <Box sx={{maxWidth: 1200, mx: 'auto', mt: 4, px: 3}}>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 4,
                flexWrap: 'wrap',
                gap: 2
            }}>
                <Typography variant="h4" sx={{display: 'flex', alignItems: 'center', gap: 2, fontWeight: 'bold'}}>
                    <DirectionsCarIcon fontSize="large" color="primary"/>
                    Мій Гараж
                </Typography>
                <TextField
                    size="small"
                    label="Пошук авто..."
                    placeholder="Марка, модель або VIN"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{maxWidth: 300, bgcolor: 'white'}}
                />
                <Button
                    variant="contained"
                    startIcon={<AddCircleOutlineIcon/>}
                    onClick={() => setOpenAddModal(true)}
                >
                    Додати авто
                </Button>
            </Box>

            {vehicles.length === 0 ? (
                <Alert severity="info" sx={{mt: 2}}>
                    У вас ще немає доданих автомобілів. Натисніть "Додати авто", щоб почати.
                </Alert>
            ) : (
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: {xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)'},
                    gap: 3
                }}>
                    {filteredVehicles.map((vehicle) => (
                        <Card key={vehicle.id} elevation={3}
                              sx={{height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2}}>
                            <CardContent sx={{flexGrow: 1, p: 3}}>
                                <Typography variant="h5" gutterBottom sx={{fontWeight: 'bold', color: 'primary.main'}}>
                                    {vehicle.brand} {vehicle.model}
                                </Typography>

                                <Box sx={{mt: 2, display: 'flex', flexDirection: 'column', gap: 1}}>
                                    <Typography variant="body1">
                                        <strong>Рік:</strong> {vehicle.year}
                                    </Typography>
                                    <Typography variant="body1" sx={{wordBreak: 'break-all'}}>
                                        <strong>VIN:</strong> {vehicle.vin}
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>Держ. номер:</strong> {vehicle.number}
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>Пробіг:</strong> {vehicle.mileage} км
                                    </Typography>
                                </Box>
                            </CardContent>
                            <Box sx={{p: 3, pt: 0, display: 'flex', flexDirection: 'column', gap: 1}}>
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
            {/* Модальне вікно створення заявки */}
            <Dialog open={openRequestModal} onClose={() => setOpenRequestModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{fontWeight: 'bold'}}>Нова заявка на ремонт</DialogTitle>
                <DialogContent dividers>
                    {selectedVehicle && (
                        <Typography variant="subtitle1" gutterBottom sx={{mb: 3}}>
                            Автомобіль: <strong>{selectedVehicle.brand} {selectedVehicle.model}</strong> ({selectedVehicle.vin})
                        </Typography>
                    )}

                    <Box component="form" id="create-request-form" onSubmit={handleCreateRequest}>
                        <Grid container spacing={3}>

                            {/* Фільтр по місту */}
                            <Grid size={{xs: 12, sm: 6}}>
                                <Autocomplete
                                    options={availableCities}
                                    value={selectedCity}
                                    onChange={(_, newValue) => {
                                        setSelectedCity(newValue);
                                        // Якщо змінили місто, скидаємо вибране СТО, бо воно може бути з іншого міста
                                        setRequestForm({...requestForm, stoId: null});
                                    }}
                                    renderInput={(params) => <TextField {...params} label="Фільтр за містом"
                                                                        placeholder="Усі міста"/>}
                                />
                            </Grid>

                            {/* Мульти-вибір послуг */}
                            <Grid size={{xs: 12, sm: 6}}>
                                <Autocomplete
                                    multiple
                                    options={availableServices}
                                    value={requestForm.selectedWorkTypes}
                                    onChange={(_, newValue) => {
                                        setRequestForm({...requestForm, selectedWorkTypes: newValue});
                                        // Якщо обрана послуга, якої немає на поточному СТО, скидаємо СТО
                                        if (requestForm.stoId) {
                                            const currentSto = stos.find(s => s.id === requestForm.stoId);
                                            const canProvideAll = newValue.every(work => currentSto?.serviceTypes?.includes(work));
                                            if (!canProvideAll) {
                                                setRequestForm(prev => ({
                                                    ...prev,
                                                    stoId: null,
                                                    selectedWorkTypes: newValue
                                                }));
                                            }
                                        }
                                    }}
                                    renderInput={(params) => <TextField {...params} label="Які роботи потрібні?"
                                                                        placeholder="Оберіть послуги"/>}
                                />
                            </Grid>

                            {/* Вибір СТО (залежить від фільтрів вище) */}
                            <Grid size={{xs: 12}}>
                                <Autocomplete
                                    options={filteredStos}
                                    getOptionLabel={(option) => `${option.stationName} (${option.city}) - ${option.address}`}
                                    value={stos.find(s => s.id === requestForm.stoId) || null}
                                    onChange={(_, newValue) => setRequestForm({
                                        ...requestForm,
                                        stoId: newValue ? newValue.id : null
                                    })}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            required
                                            label="Оберіть СТО"
                                            helperText={filteredStos.length === 0 ? "У цьому місті немає СТО, які надають обрані послуги" : ""}
                                            error={filteredStos.length === 0}
                                        />
                                    )}
                                    noOptionsText="СТО не знайдено"
                                />
                            </Grid>

                            <Grid size={{xs: 12}}>
                                <TextField
                                    required
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Додатковий опис проблеми"
                                    placeholder="Опишіть деталі для майстра..."
                                    value={requestForm.description}
                                    onChange={(e) => setRequestForm({...requestForm, description: e.target.value})}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions sx={{p: 3}}>
                    <Button onClick={() => setOpenRequestModal(false)} size="large">Скасувати</Button>
                    <Button type="submit" form="create-request-form" variant="contained" size="large">Відправити
                        заявку</Button>
                </DialogActions>
            </Dialog>
            {/* Модальне вікно додавання авто */}
            <Dialog open={openAddModal} onClose={() => setOpenAddModal(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{fontWeight: 'bold'}}>Новий автомобіль</DialogTitle>
                <DialogContent dividers>
                    <Box component="form" id="add-vehicle-form" onSubmit={handleAddVehicle} sx={{mt: 1}}>
                        <Grid container spacing={3}>
                            <Grid size={{xs: 12}}>
                                <TextField
                                    required
                                    fullWidth
                                    label="VIN Код (17 символів)"
                                    name="vin"
                                    value={formData.vin}
                                    onChange={handleVinChange}
                                    error={!!formErrors.vin || (formData.vin.length > 0 && formData.vin.length < 17)}
                                    helperText={
                                        formErrors.vin ||
                                        (formData.vin.length === 17 ? "VIN введено коректно" : `Введено ${formData.vin.length}/17 символів`)
                                    }
                                />
                            </Grid>

                            <Grid size={{xs: 12, sm: 6}}>
                                <Autocomplete
                                    options={BRANDS}
                                    value={formData.brand}
                                    onChange={(_, newValue) => {
                                        // При зміні марки автоматично очищаємо модель
                                        setFormData({...formData, brand: newValue || '', model: ''});
                                    }}
                                    renderInput={(params) => <TextField {...params} required label="Марка автомобіля"/>}
                                />
                            </Grid>

                            <Grid size={{xs: 12, sm: 6}}>
                                <Autocomplete
                                    // Пропонуємо моделі лише вибраної марки
                                    options={formData.brand ? CAR_DATA[formData.brand] || [] : []}
                                    value={formData.model}
                                    onChange={(_, newValue) => setFormData({...formData, model: newValue || ''})}
                                    disabled={!formData.brand} // Блокуємо, поки не вибрана марка
                                    renderInput={(params) => <TextField {...params} required label="Модель"/>}
                                    noOptionsText="Спочатку оберіть марку"
                                />
                            </Grid>

                            <Grid size={{xs: 12, sm: 6}}>
                                <Autocomplete
                                    options={VEHICLE_TYPES}
                                    value={formData.vehicleType}
                                    onChange={(_, newValue) => setFormData({...formData, vehicleType: newValue || ''})}
                                    renderInput={(params) => <TextField {...params} required label="Тип кузова"/>}
                                />
                            </Grid>

                            <Grid size={{xs: 12, sm: 6}}>
                                <TextField
                                    required
                                    fullWidth
                                    type="number"
                                    label="Рік випуску"
                                    name="year"
                                    value={formData.year}
                                    onChange={handleChange}
                                    error={!!formErrors.year}
                                    helperText={formErrors.year}
                                />
                            </Grid>

                            <Grid size={{xs: 12, sm: 6}}>
                                <TextField
                                    required
                                    fullWidth
                                    label="Держ. номер"
                                    name="number"
                                    value={formData.number}
                                    onChange={handleLicensePlateChange}
                                    placeholder="AA1234BB"
                                />
                            </Grid>

                            <Grid size={{xs: 12, sm: 6}}>
                                <TextField required fullWidth type="number" label="Поточний пробіг (км)" name="mileage"
                                           value={formData.mileage} onChange={handleChange}/>
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions sx={{p: 3}}>
                    <Button onClick={() => setOpenAddModal(false)} size="large">Скасувати</Button>
                    <Button type="submit" form="add-vehicle-form" variant="contained" size="large">Зберегти
                        авто</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!notification} autoHideDuration={6000} onClose={() => setNotification(null)}>
                <Alert onClose={() => setNotification(null)} severity={notification?.type} sx={{width: '100%'}}>
                    {notification?.text}
                </Alert>
            </Snackbar>
        </Box>
    );
}