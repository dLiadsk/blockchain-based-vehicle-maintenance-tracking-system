import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, TextField, Button, Grid, Alert, Snackbar,
    List, ListItemIcon, ListItemText, Divider, ListItemButton, Autocomplete,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip, CircularProgress
} from '@mui/material';

import VisibilityIcon from '@mui/icons-material/Visibility';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import StoreIcon from '@mui/icons-material/Store';
import PeopleIcon from '@mui/icons-material/People';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import GppBadIcon from '@mui/icons-material/GppBad';
import PolicyIcon from '@mui/icons-material/Policy';
import HistoryIcon from '@mui/icons-material/History';

import api from '../services/api';
import BlockchainSyncButton from '../components/BlockchainSyncButton';

// --- КОМПОНЕНТ 1: Форма створення СТО ---
const CreateStoForm = () => {
    const [formData, setFormData] = useState({
        stationName: '', region: '', city: '', address: '', description: ''
    });
    // Виносимо послуги в окремий стейт як масив рядків
    const [serviceTypes, setServiceTypes] = useState<string[]>([]);
    const [notification, setNotification] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Тепер serviceTypes вже є готовим масивом, нічого сплітити через кому не треба
        const payload = {
            ...formData,
            serviceTypes: serviceTypes
        };

        try {
            await api.post('/admin/create-sto-profile', payload);
            setNotification({ text: 'Профіль СТО успішно створено!', type: 'success' });

            // Очищуємо форму
            setFormData({ stationName: '', region: '', city: '', address: '', description: '' });
            setServiceTypes([]);
        } catch (error) {
            console.error(error);
            setNotification({ text: 'Помилка при створенні СТО. Перевірте консоль.', type: 'error' });
        }
    };

    // Стандартні підказки (можна доповнювати своїми словами)
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
                        {/* ЯДЕРНИЙ ВАРІАНТ: передаємо пропси через розширення об'єкта as any */}
                        <Autocomplete
                            {...({
                                multiple: true,
                                freeSolo: true,
                                options: suggestedServices,
                                value: serviceTypes,
                                onChange: (_event: any, newValue: any) => {
                                    setServiceTypes(newValue);
                                },
                                renderTags: (value: any[], getTagProps: any) =>
                                    value.map((option: any, index: number) => {
                                        const { key, ...tagProps } = getTagProps({ index });
                                        return (
                                            <Chip
                                                key={key}
                                                variant="filled"
                                                color="primary"
                                                label={option}
                                                {...tagProps}
                                            />
                                        );
                                    }),
                                renderInput: (params: any) => (
                                    <TextField
                                        {...params}
                                        variant="outlined"
                                        label="Види послуг"
                                        placeholder="Оберіть зі списку або введіть свою та натисніть Enter"
                                    />
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
};
// --- КОМПОНЕНТ 2: Форма створення Адміністратора СТО ---
const CreateAdminForm = () => {
    const [formData, setFormData] = useState({
        email: '', password: '', firstName: '', lastName: '', phoneNumber: ''
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
            const payload = { ...formData, stoId: selectedSto.id };
            await api.post('/admin/register-sto-admin', payload);
            setNotification({ text: 'Менеджера СТО успішно зареєстровано!', type: 'success' });
            setFormData({ email: '', password: '', firstName: '', lastName: '', phoneNumber: '' });
            setSelectedSto(null);
        } catch (error) {
            console.error(error);
            setNotification({ text: 'Помилка реєстрації. Можливо, email вже існує.', type: 'error' });
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>Реєстрація адміністратора СТО</Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Ім'я" name="firstName" value={formData.firstName} onChange={handleChange} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Прізвище" name="lastName" value={formData.lastName} onChange={handleChange} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Email адреса" type="email" name="email" value={formData.email} onChange={handleChange} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Номер телефону" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="+380..." /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Пароль" type="password" name="password" value={formData.password} onChange={handleChange} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Autocomplete
                            options={stos}
                            getOptionLabel={(option) => `${option.stationName} (${option.city})`}
                            value={selectedSto}
                            onChange={(_, newValue) => setSelectedSto(newValue)}
                            renderInput={(params) => <TextField {...params} label="Оберіть СТО" required placeholder="Почніть вводити назву..." />}
                            noOptionsText="СТО не знайдено"
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}><Button type="submit" variant="contained" size="large" fullWidth>Зареєструвати менеджера</Button></Grid>
                </Grid>
            </Box>
            <Snackbar open={!!notification} autoHideDuration={6000} onClose={() => setNotification(null)}>
                <Alert onClose={() => setNotification(null)} severity={notification?.type} sx={{ width: '100%' }}>{notification?.text}</Alert>
            </Snackbar>
        </Paper>
    );
};

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
                                    <IconButton color="primary" onClick={() => setSelectedSto(sto)}><VisibilityIcon /></IconButton>
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
                    {/* НОВИЙ БЛОК: Красиве відображення послуг */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedSto?.serviceTypes && selectedSto.serviceTypes.length > 0 ? (
                            selectedSto.serviceTypes.map((service: string, index: number) => (
                                <Chip
                                    key={index}
                                    label={service}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ fontWeight: 'medium' }}
                                />
                            ))
                        ) : (
                            <Typography variant="body2" color="text.secondary">Послуги не вказані</Typography>
                        )}
                    </Box>

                </DialogContent>
                <DialogActions><Button onClick={() => setSelectedSto(null)}>Закрити</Button></DialogActions>
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
                                    <IconButton color="primary" onClick={() => setSelectedAdmin(admin)}><VisibilityIcon /></IconButton>
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
                <DialogActions><Button onClick={() => setSelectedAdmin(null)}>Закрити</Button></DialogActions>
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
                                    <IconButton color="primary" onClick={() => setSelectedVehicle(v)}><VisibilityIcon /></IconButton>
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
                <DialogActions><Button onClick={() => setSelectedVehicle(null)}>Закрити</Button></DialogActions>
            </Dialog>
        </>
    );
};

const RequestList = () => {
    const [requests, setRequests] = useState<any[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

    const [integrityResult, setIntegrityResult] = useState<any>(null);
    const [openIntegrityModal, setOpenIntegrityModal] = useState(false);
    const [verifyingDoc, setVerifyingDoc] = useState('');
    const [isGlobalAuditing, setIsGlobalAuditing] = useState(false);

    const fetchRequests = () => {
        api.get('/admin/requests')
            .then(res => setRequests(res.data))
            .catch(console.error);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    // ПРОСТО ВІДКРИВАЄМО ДЕТАЛІ, БЕЗ ЗАПИТІВ! (Тут була проблема 403)
    const handleOpenDetails = (req: any) => {
        setSelectedRequest(req);
    };

    const handleVerifyIntegrity = async (docType: string, requestId: number) => {
        setVerifyingDoc(docType);
        try {
            const response = await api.get(`/service-requests/${requestId}/verify-integrity/${docType}`);
            setIntegrityResult(response.data);
            setOpenIntegrityModal(true);
        } catch (error: any) {
            setIntegrityResult(error.response?.data || { valid: false, message: 'Помилка з\'єднання з сервером' });
            setOpenIntegrityModal(true);
        } finally {
            setVerifyingDoc('');
        }
    };

    const handleGlobalAudit = async (requestId: number) => {
        setIsGlobalAuditing(true);
        try {
            const response = await api.get(`/audit/verify-job/${requestId}`);
            setIntegrityResult(response.data);
            setOpenIntegrityModal(true);
        } catch (error: any) {
            setIntegrityResult(error.response?.data || { valid: false, message: 'Помилка з\'єднання з сервером аудиту' });
            setOpenIntegrityModal(true);
        } finally {
            setIsGlobalAuditing(false);
        }
    };

    const renderHashWithCheck = (label: string, hash: string | undefined | null, docType: string, reqId: number) => (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid #e0e0e0' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>{label}:</Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace', mb: 1, color: hash ? 'text.primary' : 'text.secondary' }}>
                {hash || 'Документ ще не згенеровано'}
            </Typography>
            {hash && (
                <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    startIcon={<SecurityIcon />}
                    onClick={() => handleVerifyIntegrity(docType, reqId)}
                    disabled={verifyingDoc === docType}
                >
                    {verifyingDoc === docType ? 'Перевірка...' : 'Перевірити цілісність'}
                </Button>
            )}
        </Box>
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Всі сервісні заявки системи</Typography>
                <BlockchainSyncButton onSuccess={fetchRequests} />
            </Box>

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
                                <TableCell>{r.vehicle?.vin || 'Не вказано'}</TableCell>
                                <TableCell>
                                    <Chip label={r.status} color="primary" variant="outlined" size="small" />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton color="primary" onClick={() => handleOpenDetails(r)}>
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
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography><strong>Blockchain Job ID:</strong> {selectedRequest?.blockchainJobId}</Typography>
                            <Typography><strong>Поточний статус:</strong> {selectedRequest?.status}</Typography>
                            <Typography><strong>Дата створення:</strong> {new Date(selectedRequest?.createdAt).toLocaleString('uk-UA')}</Typography>
                            <Typography><strong>Опис проблеми:</strong> {selectedRequest?.description}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography><strong>VIN авто:</strong> {selectedRequest?.vehicle?.vin}</Typography>
                            <Typography><strong>STO ID:</strong> {selectedRequest?.stoId}</Typography>
                            <Typography><strong>Загальна вартість:</strong> {selectedRequest?.totalAmount || 0} UAH</Typography>
                            <Typography><strong>Депозит:</strong> {selectedRequest?.depositAmount || 0} UAH</Typography>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Список робіт:</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                {selectedRequest?.workTypes?.length > 0
                                    ? selectedRequest.workTypes.map((work: string, i: number) => <Chip key={i} label={work} size="small" color="info" variant="outlined" />)
                                    : <Typography variant="body2" color="text.secondary">Роботи ще не призначені</Typography>
                                }
                            </Box>
                        </Grid>

                        {/* БЛОК ІСТОРІЇ: ТЕПЕР ЧИТАЄМО ТІЛЬКИ З POSTGRESQL */}
                        <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 1, mt: 1 }}>
                                <HistoryIcon color="primary" /> Хронологія статусів (з бази даних):
                            </Typography>
                            <Paper variant="outlined" sx={{ bgcolor: 'grey.50', p: 2, maxHeight: 250, overflowY: 'auto' }}>
                                {selectedRequest?.statusHistory?.length > 0 ? (
                                    selectedRequest.statusHistory.map((h: any, i: number) => (
                                        <Box key={i} sx={{ mb: i !== selectedRequest.statusHistory.length - 1 ? 2 : 0, pb: i !== selectedRequest.statusHistory.length - 1 ? 1.5 : 0, borderBottom: i !== selectedRequest.statusHistory.length - 1 ? '1px dashed #ccc' : 'none' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                {h.status}
                                            </Typography>
                                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                                Дата: {new Date(h.changedAt).toLocaleString('uk-UA')}
                                            </Typography>
                                            {h.blockchainTxHash && (
                                                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                                    Хеш транзакції: <span style={{ fontFamily: 'monospace', color: '#1976d2' }}>{h.blockchainTxHash}</span>
                                                </Typography>
                                            )}
                                        </Box>
                                    ))
                                ) : (
                                    <Typography variant="body2" color="text.secondary">Історія відсутня</Typography>
                                )}
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 1, mb: 2 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Аудит цілісності (Blockchain):</Typography>
                                {selectedRequest?.blockchainJobId && (
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        startIcon={isGlobalAuditing ? <CircularProgress size={20} color="inherit" /> : <PolicyIcon />}
                                        onClick={() => handleGlobalAudit(selectedRequest.id)}
                                        disabled={isGlobalAuditing}
                                    >
                                        {isGlobalAuditing ? 'Аудит...' : 'Повний Блокчейн-аудит'}
                                    </Button>
                                )}
                            </Box>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    {renderHashWithCheck('Офіційна заявка', selectedRequest?.pdfHash, 'service_request', selectedRequest?.id)}
                                    {renderHashWithCheck('Акт виконаних робіт', selectedRequest?.workReportPdfHash, 'work_report', selectedRequest?.id)}
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    {renderHashWithCheck('Акт технічного огляду', selectedRequest?.inspectionPdfHash, 'inspection_report', selectedRequest?.id)}
                                    {renderHashWithCheck('Фіскальний чек / Завдаток', selectedRequest?.paymentReceiptPdfHash, 'deposit_receipt', selectedRequest?.id)}
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedRequest(null)} variant="contained" size="large">Закрити</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openIntegrityModal} onClose={() => setOpenIntegrityModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold', bgcolor: integrityResult?.valid ? 'success.main' : 'error.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                    {integrityResult?.valid ? <VerifiedUserIcon /> : <GppBadIcon />} Результат перевірки Blockchain
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: integrityResult?.valid ? 'success.main' : 'error.main', fontWeight: 'bold' }}>{integrityResult?.message}</Typography>
                    <Typography variant="subtitle2" color="text.secondary">Дані Блокчейну (Source of Truth):</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', mb: 2, bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>{integrityResult?.originalBlockchainHash || 'Не знайдено'}</Typography>
                    <Typography variant="subtitle2" color="text.secondary">Локальні дані (БД / Файл):</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', bgcolor: integrityResult?.valid ? 'success.50' : 'error.50', color: integrityResult?.valid ? 'success.dark' : 'error.dark', p: 1, borderRadius: 1 }}>{integrityResult?.currentFileHash || 'Помилка читання'}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenIntegrityModal(false)} size="large">Закрити</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

// --- ГОЛОВНИЙ КОМПОНЕНТ ДАШБОРДУ ---
export default function AdminDashboard() {
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

            <Box sx={{ flexGrow: 1 }}>
                {menuItems[activeTab]?.component}
            </Box>
        </Box>
    );
}