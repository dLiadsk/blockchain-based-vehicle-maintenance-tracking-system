import React, { useEffect, useState, type JSX } from 'react';
import {
    Box, Typography, Card, CardContent, Chip, CircularProgress,
    Alert, Button, Tabs, Tab, TextField, MenuItem
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useNavigate } from 'react-router-dom';

import api from '../services/api';
import type { ServiceRequest, StoProfile } from '../types';


interface PopulatedServiceRequest extends ServiceRequest {
    sto?: StoProfile;
}

type SortOrder = 'NEWEST' | 'OLDEST';

type ChipColor = "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";

/**
 * Component displaying the current user's service requests.
 * Includes features for filtering by status, date range, and sorting.
 */
export default function MyRequests(): JSX.Element {
    const navigate = useNavigate();

    // State definitions
    const [requests, setRequests] = useState<PopulatedServiceRequest[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [statusTab, setStatusTab] = useState<string>('ALL');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [sortBy, setSortBy] = useState<SortOrder>('NEWEST');

    // Fetch user requests on component mount
    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const response = await api.get<PopulatedServiceRequest[]>('/service-requests/my');
                setRequests(response.data);
            } catch (err) {
                console.error("Помилка завантаження заявок:", err);
            } finally {
                setLoading(false);
            }
        };

        void fetchRequests();
    }, []);

    // Filter and sort logic
    const filteredRequests = requests
        .filter(req => {
            // 1. Status filtering
            const matchesStatus = statusTab === 'ALL' || req.status === statusTab;

            // 2. Date range filtering
            const reqDate = new Date(req.createdAt).setHours(0, 0, 0, 0);
            const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
            const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;

            const matchesStartDate = !start || reqDate >= start;
            const matchesEndDate = !end || reqDate <= end;

            return matchesStatus && matchesStartDate && matchesEndDate;
        })
        .sort((a, b) => {
            // 3. Sorting by creation date
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();

            return sortBy === 'NEWEST' ? dateB - dateA : dateA - dateB;
        });

    /**
     * Maps a request status to a corresponding Material-UI Chip color.
     */
    const getStatusColor = (status: string): ChipColor => {
        switch (status) {
            case 'PENDING':
            case 'RequestCreated': return 'warning';
            case 'IN_PROGRESS': return 'info';
            case 'COMPLETED': return 'success';
            case 'CANCELLED': return 'error';
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

    return (
        <Box sx={{ width: '100%', maxWidth: 1000, mx: 'auto', mt: 4, px: 3, pb: 6 }}>
            <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 2, fontWeight: 'bold', mb: 4 }}>
                <AssignmentIcon fontSize="large" color="primary" />
                Мої заявки на ремонт
            </Typography>

            {/* 1. STATUS TABS */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={statusTab}
                    onChange={(_event: React.SyntheticEvent, newValue: string) => setStatusTab(newValue)}
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

            {/* 2. ADDITIONAL FILTERS (DATE & SORTING) */}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                    sx={{ minWidth: 150, bgcolor: 'white', borderRadius: 1 }}
                />

                <TextField
                    size="small"
                    type="date"
                    label="Дата по"
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={endDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                    sx={{ minWidth: 150, bgcolor: 'white', borderRadius: 1 }}
                />

                <TextField
                    select
                    size="small"
                    label="Сортування"
                    value={sortBy}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSortBy(e.target.value as SortOrder)}
                    sx={{ minWidth: 200, bgcolor: 'white', borderRadius: 1, ml: { sm: 'auto' } }}
                >
                    <MenuItem value="NEWEST">Спочатку новіші</MenuItem>
                    <MenuItem value="OLDEST">Спочатку старіші</MenuItem>
                </TextField>

                {/* Quick reset button for dates */}
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

            {/* 3. REQUESTS LIST */}
            {requests.length === 0 ? (
                <Alert severity="info">У вас ще немає створених заявок.</Alert>
            ) : filteredRequests.length === 0 ? (
                <Alert severity="warning">За вказаними фільтрами заявок не знайдено.</Alert>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {filteredRequests.map((req) => (
                        <Card key={req.id} elevation={2} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, borderRadius: 2 }}>
                            {/* Left Status Bar */}
                            <Box sx={{ p: 2, minWidth: 150, borderRight: { sm: '1px solid #eee' }, bgcolor: 'grey.50', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                <Typography variant="caption" color="text.secondary">Дата створення</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    {new Date(req.createdAt).toLocaleDateString('uk-UA')}
                                </Typography>
                                <Chip label={req.status} color={getStatusColor(req.status)} size="small" sx={{ fontWeight: 'bold' }} />
                            </Box>

                            {/* Main Content Area */}
                            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                    {req.vehicle?.brand} {req.vehicle?.model} ({req.vehicle?.number || req.vehicle?.vin})
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    <strong>СТО:</strong> {req.sto?.stationName || 'Не вказано'}
                                </Typography>
                                <Typography variant="body2" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {req.description}
                                </Typography>
                            </CardContent>

                            {/* Action Button */}
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