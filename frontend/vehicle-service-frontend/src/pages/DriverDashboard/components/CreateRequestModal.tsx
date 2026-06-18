import React, { useState, useEffect, type JSX } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Box, Grid,
    TextField, Autocomplete, Button, Typography
} from '@mui/material';
import api from '../../../services/api';
import type { Vehicle, StoProfile } from '../../../types';

interface CreateRequestModalProps {
    open: boolean;
    onClose: () => void;
    selectedVehicle: Vehicle | null;
    stos: StoProfile[];
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

/**
 * Modal component for creating a new service request.
 * Contains dynamic filtering logic to match users with STOs that provide the required services in a specific city.
 */
export default function CreateRequestModal({
                                               open,
                                               onClose,
                                               selectedVehicle,
                                               stos,
                                               onSuccess,
                                               onError
                                           }: CreateRequestModalProps): JSX.Element {
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [requestForm, setRequestForm] = useState({
        stoId: null as number | null,
        description: '',
        selectedWorkTypes: [] as string[],
        currentMileage: ''
    });

    // Reset form state whenever the modal opens or closes
    useEffect(() => {
        if (!open) {
            setSelectedCity(null);
            setRequestForm({ stoId: null, description: '', selectedWorkTypes: [], currentMileage: '' });
        }
    }, [open]);

    // 1. Extract a unique list of cities from all available STOs
    const availableCities = Array.from(new Set(stos.map(sto => sto.city).filter(Boolean)));

    // 2. Filter STOs based on the selected city AND selected services
    const filteredStos = stos.filter(sto => {
        const matchCity = selectedCity ? sto.city === selectedCity : true;

        // Check if the STO provides ALL the services the user selected
        const matchServices = requestForm.selectedWorkTypes.length > 0
            ? requestForm.selectedWorkTypes.every(work => sto.serviceTypes?.includes(work))
            : true;

        return matchCity && matchServices;
    });

    // 3. Dynamic service list generation
    // If an STO is already selected -> show ONLY that STO's services
    // If no STO is selected -> show all unique services from the currently filtered STOs
    const availableServices = requestForm.stoId
        ? (stos.find(s => s.id === requestForm.stoId)?.serviceTypes || [])
        : Array.from(new Set(filteredStos.flatMap(sto => sto.serviceTypes || [])));


    const handleCreateRequest = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        if (!requestForm.stoId || !selectedVehicle) {
            onError('Будь ласка, оберіть СТО та переконайтеся, що авто вибрано');
            return;
        }

        try {
            const payload = {
                vin: selectedVehicle.vin,
                stoId: requestForm.stoId,
                description: requestForm.description,
                workTypes: requestForm.selectedWorkTypes,
                mileage: parseInt(requestForm.currentMileage, 10)
            };

            await api.post('/service-requests/create', payload);

            onSuccess('Заявку успішно створено!');
            onClose();
        } catch (error) {
            console.error('Failed to create service request:', error);
            onError('Помилка при створенні заявки');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold' }}>Нова заявка на ремонт</DialogTitle>
            <DialogContent dividers>
                {selectedVehicle && (
                    <Typography variant="subtitle1" gutterBottom sx={{ mb: 3 }}>
                        Автомобіль: <strong>{selectedVehicle.brand} {selectedVehicle.model}</strong> ({selectedVehicle.vin})
                    </Typography>
                )}

                <Box component="form" id="create-request-form" onSubmit={handleCreateRequest}>
                    <Grid container spacing={3}>

                        {/* City Filter */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Autocomplete
                                options={availableCities}
                                value={selectedCity}
                                onChange={(_, newValue) => {
                                    setSelectedCity(newValue);
                                    // Reset selected STO if city changes, as the STO might be in a different city
                                    setRequestForm({ ...requestForm, stoId: null });
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Фільтр за містом" placeholder="Усі міста" />
                                )}
                            />
                        </Grid>

                        {/* Multiple Services Filter */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Autocomplete
                                multiple
                                options={availableServices}
                                value={requestForm.selectedWorkTypes}
                                onChange={(_, newValue) => {
                                    setRequestForm({ ...requestForm, selectedWorkTypes: newValue });

                                    // If a newly selected service is not provided by the currently selected STO, reset the STO selection
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
                                renderInput={(params) => (
                                    <TextField {...params} label="Які роботи потрібні?" placeholder="Оберіть послуги" />
                                )}
                            />
                        </Grid>

                        {/* STO Selection */}
                        <Grid size={{ xs: 12 }}>
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

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                required
                                fullWidth
                                type="number"
                                label="Поточний пробіг авто (км)"
                                value={requestForm.currentMileage}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setRequestForm({ ...requestForm, currentMileage: e.target.value })
                                }
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                required
                                fullWidth
                                multiline
                                rows={4}
                                label="Додатковий опис проблеми"
                                placeholder="Опишіть деталі для майстра..."
                                value={requestForm.description}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setRequestForm({ ...requestForm, description: e.target.value })
                                }
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} size="large">Скасувати</Button>
                <Button type="submit" form="create-request-form" variant="contained" size="large">
                    Відправити заявку
                </Button>
            </DialogActions>
        </Dialog>
    );
}