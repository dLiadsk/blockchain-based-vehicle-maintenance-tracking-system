import { useState, useEffect, type JSX } from 'react';
import {
    TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
    Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    Typography, Button, Divider
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../../../services/api';
import type {Vehicle} from '../../../types';

/**
 * Displays all registered vehicles across the entire system.
 * Provides an overview of technical details, ownership, and blockchain registration status.
 */
export default function VehicleList(): JSX.Element {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

    // Fetch the list of all vehicles on component mount
    useEffect(() => {
        api.get<Vehicle[]>('/admin/vehicles')
            .then(res => setVehicles(res.data))
            .catch(error => console.error('Failed to fetch vehicles:', error));
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
                                <TableCell>{v.owner?.email || 'Немає власника'}</TableCell>
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

            {/* Vehicle Details Modal */}
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

                    <Typography><strong>Email власника:</strong> {selectedVehicle?.owner?.email || 'Не вказано'}</Typography>
                    <Typography sx={{ wordBreak: 'break-all', mt: 1 }}>
                        <strong>Хеш реєстрації в блокчейні:</strong><br/>
                        <span style={{ fontSize: '0.85rem', color: 'gray' }}>
                            {selectedVehicle?.blockchainTxHash || 'Відсутній'}
                        </span>
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedVehicle(null)} variant="contained">
                        Закрити
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}