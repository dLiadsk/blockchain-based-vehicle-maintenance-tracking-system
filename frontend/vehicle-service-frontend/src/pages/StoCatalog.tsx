import React, { useEffect, useState, type JSX } from 'react';
import {
    Box, Typography, Card, CardContent, Button, Chip,
    CircularProgress, Alert, TextField, MenuItem
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { useNavigate } from 'react-router-dom';

import api from '../services/api';
import type { StoProfile } from '../types';

/**
 * Component displaying a catalog of all registered Service Stations (STOs).
 * Provides filtering by station name and city.
 */
export default function StoCatalog(): JSX.Element {
    const navigate = useNavigate();

    const [stos, setStos] = useState<StoProfile[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedCity, setSelectedCity] = useState<string>('ALL');

    useEffect(() => {
        const fetchStos = async () => {
            try {
                const response = await api.get<StoProfile[]>('/stos');
                setStos(response.data);
            } catch (err) {
                console.error('Failed to load STOs:', err);
            } finally {
                setLoading(false);
            }
        };

        void fetchStos();
    }, []);

    const uniqueCities = Array.from(new Set(stos.map(sto => sto.city).filter(Boolean)));

    const filteredStos = stos.filter(sto => {
        const matchesSearch = sto.stationName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCity = selectedCity === 'ALL' || sto.city === selectedCity;
        return matchesSearch && matchesCity;
    });

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, px: 3 }}>
            <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 2, fontWeight: 'bold', mb: 4 }}>
                <StorefrontIcon fontSize="large" color="primary" />
                Каталог СТО
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
                <TextField
                    size="small"
                    label="Пошук СТО за назвою..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    sx={{ minWidth: 250, bgcolor: 'white' }}
                />

                <TextField
                    select
                    size="small"
                    label="Місто"
                    value={selectedCity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedCity(e.target.value)}
                    sx={{ minWidth: 150, bgcolor: 'white' }}
                >
                    <MenuItem value="ALL">Усі міста</MenuItem>
                    {uniqueCities.map((city: string, index: number) => (
                        <MenuItem key={index} value={city}>
                            {city}
                        </MenuItem>
                    ))}
                </TextField>
            </Box>

            {stos.length === 0 ? (
                <Alert severity="info">Наразі в системі немає зареєстрованих СТО.</Alert>
            ) : filteredStos.length === 0 ? (
                <Alert severity="warning">За вказаними фільтрами СТО не знайдено.</Alert>
            ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                    {filteredStos.map((sto) => (
                        <Card key={sto.id} elevation={3} sx={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 2 }}>
                            <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
                                    {sto.stationName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {sto.city}, {sto.address}
                                </Typography>

                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                    {sto.serviceTypes?.slice(0, 3).map((srv: string, i: number) => (
                                        <Chip key={i} label={srv} size="small" variant="outlined" />
                                    ))}
                                    {sto.serviceTypes && sto.serviceTypes.length > 3 && (
                                        <Chip label={`+${sto.serviceTypes.length - 3} послуг`} size="small" />
                                    )}
                                </Box>
                            </CardContent>
                            <Box sx={{ p: 3, pt: 0 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={() => navigate(`/sto-catalog/${sto.id}`)}
                                >
                                    Переглянути СТО
                                </Button>
                            </Box>
                        </Card>
                    ))}
                </Box>
            )}
        </Box>
    );
}