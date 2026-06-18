import { useState, useEffect, type JSX } from 'react';
import {
    TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
    Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    Typography, Button, Divider
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../../../services/api';
import type {AdminProfile} from '../../../types';

/**
 * Displays a list of all STO Administrators in the system.
 * Allows viewing detailed information about an admin and their assigned STO.
 */
export default function AdminList(): JSX.Element {
    const [admins, setAdmins] = useState<AdminProfile[]>([]);
    const [selectedAdmin, setSelectedAdmin] = useState<AdminProfile | null>(null);

    // Fetch the list of STO administrators on component mount
    useEffect(() => {
        api.get<AdminProfile[]>('/admin/sto-admins')
            .then(res => setAdmins(res.data))
            .catch(error => console.error('Failed to fetch STO admins:', error));
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
                                    <IconButton color="primary" onClick={() => setSelectedAdmin(admin)}>
                                        <VisibilityIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Admin Details Modal */}
            <Dialog open={!!selectedAdmin} onClose={() => setSelectedAdmin(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>
                    Профіль Адміністратора
                </DialogTitle>
                <DialogContent dividers>
                    <Typography><strong>ID в системі:</strong> {selectedAdmin?.id}</Typography>
                    <Typography>
                        <strong>Ім'я та Прізвище:</strong> {selectedAdmin?.firstName} {selectedAdmin?.lastName}
                    </Typography>
                    <Typography><strong>Email:</strong> {selectedAdmin?.email}</Typography>
                    <Typography>
                        <strong>Телефон:</strong> {selectedAdmin?.phoneNumber || 'Не вказано'}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Typography>
                        <strong>Призначена СТО:</strong> {selectedAdmin?.stoProfile?.stationName || 'Не призначено'}
                    </Typography>
                    <Typography>
                        <strong>Адреса СТО:</strong> {selectedAdmin?.stoProfile ? `${selectedAdmin.stoProfile.city}, ${selectedAdmin.stoProfile.address}` : '—'}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedAdmin(null)} variant="contained">
                        Закрити
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}