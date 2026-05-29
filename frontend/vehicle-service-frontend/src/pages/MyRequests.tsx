import { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Chip, CircularProgress, Alert, Button, Tabs, Tab, TextField, MenuItem } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function MyRequests() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [statusTab, setStatusTab] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortBy, setSortBy] = useState('NEWEST'); // 'NEWEST' або 'OLDEST'

    useEffect(() => {
        // Припускаємо, що на бекенді є такий ендпоінт для отримання заявок поточного користувача
        api.get('/service-requests/my')
            .then(res => setRequests(res.data))
            .catch(err => console.error("Помилка завантаження заявок:", err))
            .finally(() => setLoading(false));
    }, []);

    const filteredRequests = requests
        .filter(req => {
            // 1. Фільтрація за статусом (вкладки)
            const matchesStatus = statusTab === 'ALL' || req.status === statusTab;

            // 2. Фільтрація за діапазоном дат
            const reqDate = new Date(req.createdAt).setHours(0, 0, 0, 0);

            const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
            const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;

            const matchesStartDate = !start || reqDate >= start;
            const matchesEndDate = !end || reqDate <= end;

            return matchesStatus && matchesStartDate && matchesEndDate;
        })
        .sort((a, b) => {
            // 3. Сортування за датою створення
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();

            return sortBy === 'NEWEST' ? dateB - dateA : dateA - dateB;
        });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'warning';
            case 'IN_PROGRESS': return 'info';
            case 'COMPLETED': return 'success';
            case 'CANCELLED': return 'error';
            default: return 'default';
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ width: '100%', maxWidth: 1000, mx: 'auto', mt: 4, px: 3, pb: 6 }}>
            <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 2, fontWeight: 'bold', mb: 4 }}>
                <AssignmentIcon fontSize="large" color="primary" />
                Мої заявки на ремонт
            </Typography>
            {/* 1. ВЕРХНІЙ ВІДБІР ЗА СТАТУСАМИ */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={statusTab}
                    onChange={(_, newValue) => setStatusTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                    textColor="primary"
                    indicatorColor="primary"
                >
                    <Tab label="Усі заявки" value="ALL" sx={{ fontWeight: 'bold' }} />
                    <Tab label="Нові" value="RequestCreated" sx={{ fontWeight: 'bold' }} />
                    <Tab label="В роботі" value="IN_PROGRESS" sx={{ fontWeight: 'bold' }} />
                    <Tab label="Завершені" value="COMPLETED" sx={{ fontWeight: 'bold' }} />
                    <Tab label="Скасовані" value="CANCELLED" sx={{ fontWeight: 'bold' }} />
                </Tabs>
            </Box>

            {/* 2. ПАНЕЛЬ ДОДАТКОВИХ ФІЛЬТРІВ (ДАTI ТА СОРТУВАННЯ) */}
            <Box sx={{
                display: 'flex',
                gap: 2,
                mb: 4,
                flexWrap: 'wrap',
                alignItems: 'center',
                bgcolor: 'grey.100',
                p: 2,
                borderRadius: 2
            }}>
                <TextField
                    size="small"
                    type="date"
                    label="Дата з"
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    sx={{ minWidth: 150, bgcolor: 'white', borderRadius: 1 }}
                />

                <TextField
                    size="small"
                    type="date"
                    label="Дата по"
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    sx={{ minWidth: 150, bgcolor: 'white', borderRadius: 1 }}
                />

                <TextField
                    select
                    size="small"
                    label="Сортування"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    sx={{ minWidth: 200, bgcolor: 'white', borderRadius: 1, ml: { sm: 'auto' } }}
                >
                    <MenuItem value="NEWEST">Спочатку новіші</MenuItem>
                    <MenuItem value="OLDEST">Спочатку старіші</MenuItem>
                </TextField>

                {/* Кнопка швидкого скидання дат */}
                {(startDate || endDate) && (
                    <Button
                        size="small"
                        color="secondary"
                        onClick={() => { setStartDate(''); setEndDate(''); }}
                    >
                        Очистити дати
                    </Button>
                )}
            </Box>

            {/* Рендеринг списку (твій існуючий filteredRequests.map) */}
            {requests.length === 0 ? (
                <Alert severity="info">У вас ще немає створених заявок.</Alert>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {filteredRequests.map((req) => (
                        <Card key={req.id} elevation={2} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, borderRadius: 2 }}>
                            <Box sx={{ p: 2, minWidth: 150, borderRight: { sm: '1px solid #eee' }, bgcolor: 'grey.50', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                <Typography variant="caption" color="text.secondary">Дата створення</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    {new Date(req.createdAt).toLocaleDateString('uk-UA')}
                                </Typography>
                                <Chip label={req.status} color={getStatusColor(req.status)} size="small" sx={{ fontWeight: 'bold' }} />
                            </Box>

                            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                    {req.vehicle?.brand} {req.vehicle?.model} ({req.vehicle?.licensePlate || req.vehicle?.vin})
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    <strong>СТО:</strong> {req.sto?.stationName}
                                </Typography>
                                <Typography variant="body2" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {req.description}
                                </Typography>
                            </CardContent>

                            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: { sm: '1px solid #eee' } }}>
                                <Button variant="outlined" onClick={() => navigate(`/requests/${req.id}`)}>
                                    Деталі
                                </Button>
                            </Box>
                        </Card>
                    ))}
                </Box>
            )}
        </Box>
    );
}