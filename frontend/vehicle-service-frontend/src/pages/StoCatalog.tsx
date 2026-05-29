import { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Button, Chip, CircularProgress, Alert, TextField, MenuItem } from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function StoCatalog() {
    const [stos, setStos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCity, setSelectedCity] = useState('ALL');

    useEffect(() => {
        api.get('/stos')
            .then(res => setStos(res.data))
            .catch(err => console.error("Помилка завантаження СТО:", err))
            .finally(() => setLoading(false));
    }, []);

    const uniqueCities = Array.from(new Set(stos.map(sto => sto.city)));
    const filteredStos = stos.filter(sto => {
        const matchesSearch = sto.stationName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCity = selectedCity === 'ALL' || sto.city === selectedCity;
        return matchesSearch && matchesCity;
    });

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

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
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ minWidth: 250, bgcolor: 'white' }}
                />

                <TextField
                    select
                    size="small"
                    label="Місто"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    sx={{ minWidth: 150, bgcolor: 'white' }}
                >
                    <MenuItem value="ALL">Усі міста</MenuItem>

                    {uniqueCities.map((city: any, index: number) => (
                        <MenuItem key={index} value={city}>
                            {city}
                        </MenuItem>
                    ))}
                </TextField>
            </Box>
            {stos.length === 0 ? (
                <Alert severity="info">Наразі в системі немає зареєстрованих СТО.</Alert>
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
                                    {/* Показуємо перші 3 послуги для прев'ю */}
                                    {sto.serviceTypes?.slice(0, 3).map((srv: string, i: number) => (
                                        <Chip key={i} label={srv} size="small" variant="outlined" />
                                    ))}
                                    {sto.serviceTypes?.length > 3 && (
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