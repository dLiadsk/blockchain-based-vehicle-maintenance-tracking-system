import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Alert, CircularProgress, Button, Tabs, Tab, TextField
} from '@mui/material';
import api from '../services/api';

export default function StoDashboard() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tabValue, setTabValue] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/sto/requests')
            .then(res => setRequests(res.data))
            .catch(err => {
                console.error(err);
                setError('Не вдалося завантажити заявки');
            })
            .finally(() => setLoading(false));
    }, []);

    const finishedStatuses = ['Completed', 'COMPLETED', 'ReadyForPickup', 'Finalized'];
    const canceledStatuses = ['Canceled', 'CANCELLED'];

    // Єдина правильна функція фільтрації (статус + пошук)
    const getFilteredRequests = () => {
        return requests.filter(req => {
            const status = req.status;

            // 1. Фільтр по статусу
            let statusMatch = true;
            if (tabValue === 0) statusMatch = !finishedStatuses.includes(status) && !canceledStatuses.includes(status);
            else if (tabValue === 1) statusMatch = finishedStatuses.includes(status);
            else if (tabValue === 2) statusMatch = canceledStatuses.includes(status);

            // 2. Фільтр по пошуку
            const lowerSearch = searchTerm.toLowerCase();
            const searchMatch =
                req.id?.toString().includes(lowerSearch) ||
                req.vehicle?.vin?.toLowerCase().includes(lowerSearch) ||
                req.customer?.lastName?.toLowerCase().includes(lowerSearch);

            return statusMatch && searchMatch;
        });
    };

    const getStatusChipColor = (status: string) => {
        if (finishedStatuses.includes(status)) return 'success';
        if (canceledStatuses.includes(status)) return 'error';

        switch (status) {
            case 'RequestCreated':
            case 'PENDING':
                return 'default';
            case 'AcceptedByAdmin':
                return 'primary';
            case 'VehicleArrived':
                return 'warning';
            case 'Inspected':
                return 'secondary';
            case 'DepositPaid':
            case 'ReadyForRepair':
            case 'WorkInProgress':
                return 'info';
            default:
                return 'default';
        }
    };

    if (loading) return <Box sx={{display: 'flex', justifyContent: 'center', mt: 10}}><CircularProgress/></Box>;

    const filteredRequests = getFilteredRequests();
    const activeCount = requests.filter(req => !finishedStatuses.includes(req.status) && !canceledStatuses.includes(req.status)).length;

    return (
        <Box sx={{p: 3, maxWidth: 1200, mx: 'auto'}}>
            <Typography variant="h4" sx={{fontWeight: 'bold', mb: 3}}>Робочий стіл СТО</Typography>
            {error && <Alert severity="error" sx={{mb: 3}}>{error}</Alert>}

            <Paper sx={{mb: 1}} elevation={1}>
                <Box sx={{p: 2}}>
                    <TextField
                        fullWidth
                        label="Пошук за ID, Прізвищем або VIN-кодом"
                        variant="outlined"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </Box>
            </Paper>
            <Paper sx={{mb: 2}} elevation={1}>
                <Tabs
                    value={tabValue}
                    onChange={(_, newValue) => setTabValue(newValue)}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                >
                    <Tab label={`Активні (${activeCount})`}/>
                    <Tab label="Завершені / Готові"/>
                    <Tab label="Скасовані"/>
                    <Tab label={`Усі заявки (${requests.length})`}/>
                </Tabs>

            </Paper>

            <TableContainer component={Paper} elevation={3}>
                <Table>
                    <TableHead sx={{bgcolor: 'grey.200'}}>
                        <TableRow>
                            <TableCell sx={{fontWeight: 'bold'}}>ID / Дата</TableCell>
                            <TableCell sx={{fontWeight: 'bold'}}>Автомобіль</TableCell>
                            <TableCell sx={{fontWeight: 'bold'}}>Проблема</TableCell>
                            <TableCell sx={{fontWeight: 'bold'}}>Статус</TableCell>
                            <TableCell align="right" sx={{fontWeight: 'bold'}}>Дія</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredRequests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{py: 3, color: 'text.secondary'}}>
                                    Заявки у цій категорії відсутні
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRequests.map((req) => (
                                <TableRow
                                    key={req.id}
                                    hover
                                    onClick={() => navigate(`/sto/requests/${req.id}`)}
                                    sx={{cursor: 'pointer'}}
                                >
                                    <TableCell>
                                        <strong>#{req.id}</strong><br/>
                                        <span style={{fontSize: '0.8rem', color: 'gray'}}>
                                            {req.createdAt ? new Date(req.createdAt).toLocaleDateString('uk-UA') : '---'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {req.vehicle?.brand} {req.vehicle?.model}<br/>
                                        <span style={{fontSize: '0.8rem', color: 'gray', fontFamily: 'monospace'}}>
                                            {req.vehicle?.vin}
                                        </span>
                                    </TableCell>
                                    <TableCell sx={{maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                        {req.description}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={req.status}
                                            color={getStatusChipColor(req.status)}
                                            variant="outlined"
                                            size="small"
                                            sx={{fontWeight: 'bold'}}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button size="small" variant="contained">Відкрити</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}