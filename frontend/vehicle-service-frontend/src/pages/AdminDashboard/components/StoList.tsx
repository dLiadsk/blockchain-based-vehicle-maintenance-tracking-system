import { useState, useEffect, type JSX } from 'react';
import {
    TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
    Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    Typography, Button, Box, Chip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../../../services/api';
import type {StoProfile} from '../../../types';

/**
 * Displays a list of all registered STOs in the system.
 * Allows administrators to view detailed information about each station via a modal.
 */
export default function StoList(): JSX.Element {
    const [stos, setStos] = useState<StoProfile[]>([]);
    const [selectedSto, setSelectedSto] = useState<StoProfile | null>(null);

    // Fetch STO data on component mount
    useEffect(() => {
        api.get<StoProfile[]>('/stos')
            .then(res => setStos(res.data))
            .catch(error => console.error('Failed to fetch STO list:', error));
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

            {/* STO Details Modal */}
            <Dialog open={!!selectedSto} onClose={() => setSelectedSto(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>
                    Профіль СТО: {selectedSto?.stationName}
                </DialogTitle>
                <DialogContent dividers>
                    <Typography><strong>ID:</strong> {selectedSto?.id}</Typography>
                    <Typography><strong>Регіон:</strong> {selectedSto?.region}</Typography>
                    <Typography><strong>Місто:</strong> {selectedSto?.city}</Typography>
                    <Typography><strong>Адреса:</strong> {selectedSto?.address}</Typography>
                    <Typography sx={{ mt: 2 }}>
                        <strong>Опис:</strong> {selectedSto?.description || 'Немає опису'}
                    </Typography>

                    <Typography sx={{ mt: 2, mb: 1 }}><strong>Послуги:</strong></Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedSto?.serviceTypes && selectedSto.serviceTypes.length > 0 ? (
                            selectedSto.serviceTypes.map((service, index) => (
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
                            <Typography variant="body2" color="text.secondary">
                                Послуги не вказані
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedSto(null)} variant="contained">
                        Закрити
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}