import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, TextField, Button, Grid, Alert, Snackbar,
    List, ListItemIcon, ListItemText, Divider, ListItemButton, Autocomplete,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip
} from '@mui/material';

import VisibilityIcon from '@mui/icons-material/Visibility';
// Іконки для меню
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import StoreIcon from '@mui/icons-material/Store';
import PeopleIcon from '@mui/icons-material/People';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AssignmentIcon from '@mui/icons-material/Assignment';

import api from '../services/api';

// --- КОМПОНЕНТ 1: Форма створення СТО (та, що вже працює) ---
const CreateStoForm = () => {
    const [formData, setFormData] = useState({
        stationName: '', region: '', city: '', address: '', description: '', serviceTypes: ''
    });
    const [notification, setNotification] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            serviceTypes: formData.serviceTypes.split(',').map(type => type.trim()).filter(type => type !== '')
        };

        try {
            await api.post('/admin/create-sto-profile', payload);
            setNotification({ text: 'Профіль СТО успішно створено!', type: 'success' });
            setFormData({ stationName: '', region: '', city: '', address: '', description: '', serviceTypes: '' });
        } catch (error) {
            console.error(error);
            setNotification({ text: 'Помилка при створенні СТО. Перевірте консоль.', type: 'error' });
        }
    };

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
                        <TextField fullWidth label="Види послуг (через кому)" name="serviceTypes" value={formData.serviceTypes} onChange={handleChange} placeholder="Наприклад: Заміна масла, Ремонт двигуна" />
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
};

// --- КОМПОНЕНТ 2: Форма створення Адміністратора СТО ---
const CreateAdminForm = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phoneNumber: ''
    });

    const [stos, setStos] = useState<any[]>([]);
    const [selectedSto, setSelectedSto] = useState<any | null>(null);
    const [notification, setNotification] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const fetchStos = async () => {
            try {
                const response = await api.get('/stos');
                setStos(response.data);
            } catch (error) {
                console.error("Помилка завантаження списку СТО:", error);
                setNotification({ text: 'Не вдалося завантажити список станцій', type: 'error' });
            }
        };
        fetchStos();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedSto) {
            setNotification({ text: 'Будь ласка, оберіть СТО зі списку', type: 'error' });
            return;
        }

        try {
            const payload = {
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phoneNumber: formData.phoneNumber,
                stoId: selectedSto.id
            };

            await api.post('/admin/register-sto-admin', payload);

            setNotification({ text: 'Менеджера СТО успішно зареєстровано!', type: 'success' });
            // Очищаємо форму
            setFormData({ email: '', password: '', firstName: '', lastName: '', phoneNumber: '' });
            setSelectedSto(null);
        } catch (error) {
            console.error(error);
            setNotification({ text: 'Помилка реєстрації. Можливо, email вже існує.', type: 'error' });
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
                Реєстрація адміністратора СТО
            </Typography>

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
                        <Button type="submit" variant="contained" size="large" fullWidth>
                            Зареєструвати менеджера
                        </Button>
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
};


// --- ТАБЛИЦІ АДМІН-ПАНЕЛІ ---

// --- ТАБЛИЦІ З ДЕТАЛЮВАННЯМ ---

const StoList = () => {
    const [stos, setStos] = useState<any[]>([]);
    const [selectedSto, setSelectedSto] = useState<any | null>(null);

    useEffect(() => {
        api.get('/stos').then(res => setStos(res.data)).catch(console.error);
    }, []);

    return (
        <>
            <TableContainer component={Paper} elevation={3}>
                <Table>
                    <TableHead sx={{ bgcolor: 'primary.light' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>ID</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Назва СТО</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Місто</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white' }}>Дії</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {stos.map((sto) => (
                            <TableRow key={sto.id} hover>
                                <TableCell>{sto.id}</TableCell>
                                <TableCell>{sto.stationName}</TableCell>
                                <TableCell>{sto.city}</TableCell>
                                <TableCell align="right">
                                    <IconButton color="primary" onClick={() => setSelectedSto(sto)}>
                                        <VisibilityIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={!!selectedSto} onClose={() => setSelectedSto(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Профіль СТО: {selectedSto?.stationName}</DialogTitle>
                <DialogContent dividers>
                    <Typography><strong>ID:</strong> {selectedSto?.id}</Typography>
                    <Typography><strong>Регіон:</strong> {selectedSto?.region}</Typography>
                    <Typography><strong>Місто:</strong> {selectedSto?.city}</Typography>
                    <Typography><strong>Адреса:</strong> {selectedSto?.address}</Typography>
                    <Typography sx={{ mt: 2 }}><strong>Опис:</strong> {selectedSto?.description || 'Немає опису'}</Typography>
                    <Typography sx={{ mt: 2, mb: 1 }}><strong>Послуги:</strong></Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedSto?.serviceTypes?.map((service: string, i: number) => (
                            <Chip key={i} label={service} size="small" color="info" />
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedSto(null)}>Закрити</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

const AdminList = () => {
    const [admins, setAdmins] = useState<any[]>([]);
    const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null);

    useEffect(() => {
        api.get('/admin/sto-admins').then(res => setAdmins(res.data)).catch(console.error);
    }, []);

    return (
        <>
            <TableContainer component={Paper} elevation={3}>
                <Table>
                    <TableHead sx={{ bgcolor: 'primary.light' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Ім'я та Прізвище</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>СТО</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white' }}>Дії</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {admins.map((admin) => (
                            <TableRow key={admin.email} hover>
                                <TableCell>{admin.firstName} {admin.lastName}</TableCell>
                                <TableCell>{admin.email}</TableCell>
                                <TableCell>{admin.stoProfile?.stationName || 'Не призначено'}</TableCell>
                                <TableCell align="right">
                                    <IconButton color="primary" onClick={() => setSelectedAdmin(admin)}>
                                        <VisibilityIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={!!selectedAdmin} onClose={() => setSelectedAdmin(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Профіль Адміністратора</DialogTitle>
                <DialogContent dividers>
                    <Typography><strong>ID в системі:</strong> {selectedAdmin?.id}</Typography>
                    <Typography><strong>Ім'я та Прізвище:</strong> {selectedAdmin?.firstName} {selectedAdmin?.lastName}</Typography>
                    <Typography><strong>Email:</strong> {selectedAdmin?.email}</Typography>
                    <Typography><strong>Телефон:</strong> {selectedAdmin?.phoneNumber || 'Не вказано'}</Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography><strong>Призначена СТО:</strong> {selectedAdmin?.stoProfile?.stationName || 'Не призначено'}</Typography>
                    <Typography><strong>Адреса СТО:</strong> {selectedAdmin?.stoProfile?.city}, {selectedAdmin?.stoProfile?.address}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedAdmin(null)}>Закрити</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

const VehicleList = () => {
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);

    useEffect(() => {
        api.get('/admin/vehicles').then(res => setVehicles(res.data)).catch(console.error);
    }, []);

    return (
        <>
            <TableContainer component={Paper} elevation={3}>
                <Table>
                    <TableHead sx={{ bgcolor: 'primary.light' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>VIN Код</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Марка/Модель</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Власник (Email)</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white' }}>Дії</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {vehicles.map((v) => (
                            <TableRow key={v.id} hover>
                                <TableCell>{v.vin}</TableCell>
                                <TableCell>{v.brand} {v.model}</TableCell>
                                <TableCell>{v.owner?.email}</TableCell>
                                <TableCell align="right">
                                    <IconButton color="primary" onClick={() => setSelectedVehicle(v)}>
                                        <VisibilityIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={!!selectedVehicle} onClose={() => setSelectedVehicle(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Технічний паспорт авто</DialogTitle>
                <DialogContent dividers>
                    <Typography><strong>VIN:</strong> {selectedVehicle?.vin}</Typography>
                    <Typography><strong>Марка:</strong> {selectedVehicle?.brand}</Typography>
                    <Typography><strong>Модель:</strong> {selectedVehicle?.model}</Typography>
                    <Typography><strong>Рік випуску:</strong> {selectedVehicle?.year}</Typography>
                    <Typography><strong>Тип кузова:</strong> {selectedVehicle?.vehicleType}</Typography>
                    <Typography><strong>Поточний пробіг:</strong> {selectedVehicle?.mileage} км</Typography>
                    <Typography><strong>Держ. номер:</strong> {selectedVehicle?.number || 'Не вказано'}</Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography><strong>Email власника:</strong> {selectedVehicle?.owner?.email}</Typography>
                    <Typography sx={{ wordBreak: 'break-all', mt: 1 }}>
                        <strong>Хеш реєстрації в блокчейні:</strong><br/>
                        <span style={{ fontSize: '0.85rem', color: 'gray' }}>{selectedVehicle?.blockchainTxHash || 'Відсутній'}</span>
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedVehicle(null)}>Закрити</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

const RequestList = () => {
    const [requests, setRequests] = useState<any[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

    useEffect(() => {
        api.get('/admin/requests').then(res => setRequests(res.data)).catch(console.error);
    }, []);

    return (
        <>
            <TableContainer component={Paper} elevation={3}>
                <Table>
                    <TableHead sx={{ bgcolor: 'primary.light' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Job ID</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>VIN</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Статус</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white' }}>Дії</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {requests.map((r) => (
                            <TableRow key={r.id} hover>
                                <TableCell>{r.blockchainJobId || 'Очікує'}</TableCell>
                                <TableCell>{r.vehicleVin}</TableCell>
                                <TableCell>
                                    <Chip label={r.status} color="primary" variant="outlined" size="small" />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton color="primary" onClick={() => setSelectedRequest(r)}>
                                        <VisibilityIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={!!selectedRequest} onClose={() => setSelectedRequest(null)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Деталі сервісної заявки #{selectedRequest?.id}</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography><strong>Blockchain Job ID:</strong> {selectedRequest?.blockchainJobId}</Typography>
                            <Typography><strong>Поточний статус:</strong> {selectedRequest?.status}</Typography>
                            <Typography><strong>Дата створення:</strong> {new Date(selectedRequest?.createdAt).toLocaleString('uk-UA')}</Typography>
                            <Typography><strong>Опис проблеми:</strong> {selectedRequest?.description}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography><strong>VIN авто:</strong> {selectedRequest?.vehicleVin}</Typography>
                            <Typography><strong>STO ID:</strong> {selectedRequest?.stoId}</Typography>
                            <Typography><strong>Загальна вартість:</strong> {selectedRequest?.totalAmount || 0} UAH</Typography>
                            <Typography><strong>Депозит:</strong> {selectedRequest?.depositAmount || 0} UAH</Typography>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Список робіт:</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                {selectedRequest?.workTypes?.length > 0
                                    ? selectedRequest.workTypes.map((work: string, i: number) => <Chip key={i} label={work} size="small" />)
                                    : <Typography variant="body2" color="text.secondary">Роботи ще не призначені</Typography>
                                }
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Хеші документів (SHA-256):</Typography>
                            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}><strong>Заявка:</strong> {selectedRequest?.pdfHash || '—'}</Typography>
                            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}><strong>Інспекція:</strong> {selectedRequest?.inspectionPdfHash || '—'}</Typography>
                            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}><strong>Звіт робіт:</strong> {selectedRequest?.workReportPdfHash || '—'}</Typography>
                            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}><strong>Чек:</strong> {selectedRequest?.paymentReceiptPdfHash || '—'}</Typography>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedRequest(null)} variant="contained">Закрити</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

// --- ГОЛОВНИЙ КОМПОНЕНТ ДАШБОРДУ ---
export default function AdminDashboard() {
    // Стейт для відстеження активного пункту меню
    const [activeTab, setActiveTab] = useState(0);

    const menuItems = [
        { text: 'Створити СТО', icon: <AddBusinessIcon />, component: <CreateStoForm /> },
        { text: 'Створити адміна СТО', icon: <PersonAddIcon />, component: <CreateAdminForm /> },
        { isDivider: true },
        { text: 'Список всіх СТО', icon: <StoreIcon />, component: <StoList /> },
        { text: 'Список адміністраторів', icon: <PeopleIcon />, component: <AdminList /> },
        { text: 'Список автомобілів', icon: <DirectionsCarIcon />, component: <VehicleList /> },
        { text: 'Список заявок', icon: <AssignmentIcon />, component: <RequestList /> },
    ];

    return (
        <Box sx={{ display: 'flex', gap: 3, mt: 2, height: '100%' }}>

            {/* Бокове меню навігації */}
            <Paper elevation={2} sx={{ width: 280, flexShrink: 0, height: 'fit-content' }}>
                <List component="nav">
                    {menuItems.map((item, index) => (
                        item.isDivider ? (
                            <Divider key={`divider-${index}`} sx={{ my: 1 }} />
                        ) : (
                            <ListItemButton
                                key={item.text}
                                selected={activeTab === index}
                                onClick={() => setActiveTab(index)}
                            >
                                <ListItemIcon sx={{ color: activeTab === index ? 'primary.main' : 'inherit' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    sx={{ color: activeTab === index ? 'primary.main' : 'inherit' }}
                                />
                            </ListItemButton>
                        )
                    ))}
                </List>
            </Paper>

            {/* Зона відображення контенту (змінюється залежно від кліку) */}
            <Box sx={{ flexGrow: 1 }}>
                {menuItems[activeTab]?.component}
            </Box>

        </Box>
    );
}