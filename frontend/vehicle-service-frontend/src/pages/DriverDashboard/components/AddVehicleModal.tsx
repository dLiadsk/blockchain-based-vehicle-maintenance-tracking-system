import React, { useState, type JSX } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Box, Grid,
    TextField, Autocomplete, Button
} from '@mui/material';
import api from '../../../services/api';

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
};

const BRANDS = Object.keys(CAR_DATA);

interface AddVehicleModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

/**
 * Modal component for registering a new vehicle to the user's garage.
 * Includes strict validation for VIN, Year, and License Plate formats.
 */
export default function AddVehicleModal({ open, onClose, onSuccess, onError }: AddVehicleModalProps): JSX.Element {
    const [formData, setFormData] = useState({
        vin: '', brand: '', model: '', year: '', vehicleType: '', number: '', mileage: ''
    });
    const [formErrors, setFormErrors] = useState({ vin: '', year: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleVinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.toUpperCase();
        const sanitizedValue = rawValue.replace(/[^A-Z0-9]/g, '').slice(0, 17);
        setFormData({ ...formData, vin: sanitizedValue });
    };

    const handleLicensePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.toUpperCase();
        const sanitizedValue = rawValue.replace(/[^A-Z0-9-]/g, '').slice(0, 10);
        setFormData({ ...formData, number: sanitizedValue });
    };

    const handleAddVehicle = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        let isValid = true;
        const errors = { vin: '', year: '' };

        // Strict VIN validation (17 alphanumeric chars, excluding I, O, Q)
        const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
        if (!vinRegex.test(formData.vin)) {
            errors.vin = 'VIN код має складатись із 17 символів (без I, O, Q)';
            isValid = false;
        }

        // Year validation
        const currentYear = new Date().getFullYear();
        const yearNum = parseInt(formData.year, 10);
        if (yearNum < 1900 || yearNum > currentYear) {
            errors.year = `Рік має бути від 1900 до ${currentYear}`;
            isValid = false;
        }

        setFormErrors(errors);

        if (!isValid) {
            onError('Будь ласка, виправте помилки у формі');
            return;
        }

        try {
            const payload = {
                ...formData,
                year: yearNum,
                mileage: parseInt(formData.mileage, 10)
            };

            await api.post('/vehicles/register', payload);

            // Reset form and notify parent
            setFormData({ vin: '', brand: '', model: '', year: '', vehicleType: '', number: '', mileage: '' });
            onSuccess('Автомобіль успішно додано!');
            onClose();
        } catch (error) {
            console.error('Failed to add vehicle:', error);
            onError('Помилка при додаванні авто. Перевірте дані.');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold' }}>Новий автомобіль</DialogTitle>
            <DialogContent dividers>
                <Box component="form" id="add-vehicle-form" onSubmit={handleAddVehicle} sx={{ mt: 1 }}>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12 }}>
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

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Autocomplete
                                options={BRANDS}
                                value={formData.brand}
                                onChange={(_, newValue) => {
                                    setFormData({ ...formData, brand: newValue || '', model: '' });
                                }}
                                renderInput={(params) => <TextField {...params} required label="Марка автомобіля" />}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Autocomplete
                                options={formData.brand ? CAR_DATA[formData.brand] || [] : []}
                                value={formData.model}
                                onChange={(_, newValue) => setFormData({ ...formData, model: newValue || '' })}
                                disabled={!formData.brand}
                                renderInput={(params) => <TextField {...params} required label="Модель" />}
                                noOptionsText="Спочатку оберіть марку"
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Autocomplete
                                options={VEHICLE_TYPES}
                                value={formData.vehicleType}
                                onChange={(_, newValue) => setFormData({ ...formData, vehicleType: newValue || '' })}
                                renderInput={(params) => <TextField {...params} required label="Тип кузова" />}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
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

                        <Grid size={{ xs: 12, sm: 6 }}>
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

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                required
                                fullWidth
                                type="number"
                                label="Поточний пробіг (км)"
                                name="mileage"
                                value={formData.mileage}
                                onChange={handleChange}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} size="large">Скасувати</Button>
                <Button type="submit" form="add-vehicle-form" variant="contained" size="large">
                    Зберегти авто
                </Button>
            </DialogActions>
        </Dialog>
    );
}