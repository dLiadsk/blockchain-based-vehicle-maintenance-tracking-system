import { useState, useEffect, type JSX } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
    DialogActions, Button, Grid, Chip, Divider, CircularProgress
} from '@mui/material';

import VisibilityIcon from '@mui/icons-material/Visibility';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import GppBadIcon from '@mui/icons-material/GppBad';
import PolicyIcon from '@mui/icons-material/Policy';
import HistoryIcon from '@mui/icons-material/History';

import api from '../../../services/api';
import BlockchainSyncButton from '../../../components/BlockchainSyncButton';
import type { ServiceRequest, IntegrityResult } from '../../../types';

/**
 * Sub-component to display the result of a Blockchain Integrity Audit.
 */
const IntegrityResultDialog = ({
                                   open,
                                   onClose,
                                   result
                               }: {
    open: boolean;
    onClose: () => void;
    result: IntegrityResult | null;
}): JSX.Element => (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', bgcolor: result?.valid ? 'success.main' : 'error.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
            {result?.valid ? <VerifiedUserIcon /> : <GppBadIcon />} Результат перевірки Blockchain
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: result?.valid ? 'success.main' : 'error.main', fontWeight: 'bold' }}>
                {result?.message}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary">Дані Блокчейну (Source of Truth):</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', mb: 2, bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                {result?.originalBlockchainHash || 'Не знайдено'}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary">Локальні дані (БД / Файл):</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', bgcolor: result?.valid ? 'success.50' : 'error.50', color: result?.valid ? 'success.dark' : 'error.dark', p: 1, borderRadius: 1 }}>
                {result?.currentFileHash || 'Помилка читання'}
            </Typography>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose} size="large">Закрити</Button>
        </DialogActions>
    </Dialog>
);

/**
 * Displays all service requests in the system.
 * Allows administrators to view request details, status history, and perform blockchain integrity audits.
 */
export default function RequestList(): JSX.Element {
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);

    const [integrityResult, setIntegrityResult] = useState<IntegrityResult | null>(null);
    const [openIntegrityModal, setOpenIntegrityModal] = useState<boolean>(false);
    const [verifyingDoc, setVerifyingDoc] = useState<string>('');
    const [isGlobalAuditing, setIsGlobalAuditing] = useState<boolean>(false);

    /**
     * Fetches all service requests from the backend.
     */
    const fetchRequests = () => {
        api.get<ServiceRequest[]>('/admin/requests')
            .then(res => setRequests(res.data))
            .catch(error => console.error('Failed to fetch requests:', error));
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    /**
     * Verifies the integrity of a specific document against the blockchain hash.
     *
     * @param docType - The type of document to verify (e.g., 'service_request', 'work_report').
     * @param requestId - The ID of the service request.
     */
    const handleVerifyIntegrity = async (docType: string, requestId: number) => {
        setVerifyingDoc(docType);
        try {
            const response = await api.get<IntegrityResult>(`/service-requests/${requestId}/verify-integrity/${docType}`);
            setIntegrityResult(response.data);
            setOpenIntegrityModal(true);
        } catch (error: any) {
            setIntegrityResult(error.response?.data || { valid: false, message: 'Помилка з\'єднання з сервером' });
            setOpenIntegrityModal(true);
        } finally {
            setVerifyingDoc('');
        }
    };

    /**
     * Triggers a comprehensive blockchain audit for all documents related to a specific job.
     *
     * @param requestId - The ID of the service request.
     */
    const handleGlobalAudit = async (requestId: number) => {
        setIsGlobalAuditing(true);
        try {
            const response = await api.get<IntegrityResult>(`/audit/verify-job/${requestId}`);
            setIntegrityResult(response.data);
            setOpenIntegrityModal(true);
        } catch (error: any) {
            setIntegrityResult(error.response?.data || { valid: false, message: 'Помилка з\'єднання з сервером аудиту' });
            setOpenIntegrityModal(true);
        } finally {
            setIsGlobalAuditing(false);
        }
    };

    /**
     * Helper function to render a hash validation block for a specific document type.
     */
    const renderHashWithCheck = (label: string, hash: string | undefined | null, docType: string, reqId: number) => (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid #e0e0e0' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>{label}:</Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace', mb: 1, color: hash ? 'text.primary' : 'text.secondary' }}>
                {hash || 'Документ ще не згенеровано'}
            </Typography>
            {hash && (
                <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    startIcon={<SecurityIcon />}
                    onClick={() => { void handleVerifyIntegrity(docType, reqId); }}
                    disabled={verifyingDoc === docType}
                >
                    {verifyingDoc === docType ? 'Перевірка...' : 'Перевірити цілісність'}
                </Button>
            )}
        </Box>
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Всі сервісні заявки системи</Typography>
                <BlockchainSyncButton onSuccess={fetchRequests} />
            </Box>

            <TableContainer component={Paper} elevation={3}>
                <Table>
                    <TableHead sx={{ bgcolor: 'primary.light' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Job ID</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>VIN</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Статус</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white' }}>Дії</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {requests.map((r) => (
                            <TableRow key={r.id} hover>
                                <TableCell>{r.blockchainJobId || 'Очікує'}</TableCell>
                                <TableCell>{r.vehicle?.vin || 'Не вказано'}</TableCell>
                                <TableCell>
                                    <Chip label={r.status} color="primary" variant="outlined" size="small" />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton color="primary" onClick={() => setSelectedRequest(r)}>
                                        <VisibilityIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Request Details Modal */}
            <Dialog open={!!selectedRequest} onClose={() => setSelectedRequest(null)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Деталі сервісної заявки #{selectedRequest?.id}</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography><strong>Blockchain Job ID:</strong> {selectedRequest?.blockchainJobId || 'Відсутній'}</Typography>
                            <Typography><strong>Поточний статус:</strong> {selectedRequest?.status}</Typography>
                            <Typography>
                                <strong>Дата створення:</strong> {selectedRequest?.createdAt ? new Date(selectedRequest.createdAt).toLocaleString('uk-UA') : 'Не вказано'}
                            </Typography>
                            <Typography><strong>Опис проблеми:</strong> {selectedRequest?.description}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography><strong>VIN авто:</strong> {selectedRequest?.vehicle?.vin || 'Не вказано'}</Typography>
                            <Typography><strong>STO ID:</strong> {selectedRequest?.stoId}</Typography>
                            <Typography><strong>Загальна вартість:</strong> {selectedRequest?.totalAmount || 0} UAH</Typography>
                            <Typography><strong>Депозит:</strong> {selectedRequest?.depositAmount || 0} UAH</Typography>
                        </Grid>

                        {/* Work Types Section */}
                        <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Список робіт:</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                {selectedRequest?.workTypes && selectedRequest.workTypes.length > 0
                                    ? selectedRequest.workTypes.map((work, i) => <Chip key={i} label={work} size="small" color="info" variant="outlined" />)
                                    : <Typography variant="body2" color="text.secondary">Роботи ще не призначені</Typography>
                                }
                            </Box>
                        </Grid>

                        {/* Status History Section */}
                        <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 1, mt: 1 }}>
                                <HistoryIcon color="primary" /> Хронологія статусів (з бази даних):
                            </Typography>
                            <Paper variant="outlined" sx={{ bgcolor: 'grey.50', p: 2, maxHeight: 250, overflowY: 'auto' }}>
                                {selectedRequest?.statusHistory && selectedRequest.statusHistory.length > 0 ? (
                                    selectedRequest.statusHistory.map((h, i) => (
                                        <Box key={i} sx={{ mb: i !== selectedRequest.statusHistory!.length - 1 ? 2 : 0, pb: i !== selectedRequest.statusHistory!.length - 1 ? 1.5 : 0, borderBottom: i !== selectedRequest.statusHistory!.length - 1 ? '1px dashed #ccc' : 'none' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                {h.status}
                                            </Typography>
                                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                                Дата: {h.changedAt ? new Date(h.changedAt).toLocaleString('uk-UA') : 'Невідомо'}
                                            </Typography>
                                            {h.blockchainTxHash && (
                                                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                                    Хеш транзакції: <span style={{ fontFamily: 'monospace', color: '#1976d2' }}>{h.blockchainTxHash}</span>
                                                </Typography>
                                            )}
                                        </Box>
                                    ))
                                ) : (
                                    <Typography variant="body2" color="text.secondary">Історія відсутня</Typography>
                                )}
                            </Paper>
                        </Grid>

                        {/* Blockchain Audit Section */}
                        <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 1, mb: 2 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Аудит цілісності (Blockchain):</Typography>
                                {selectedRequest?.blockchainJobId && selectedRequest.id && (
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        startIcon={isGlobalAuditing ? <CircularProgress size={20} color="inherit" /> : <PolicyIcon />}
                                        onClick={() => { void handleGlobalAudit(selectedRequest.id); }}
                                        disabled={isGlobalAuditing}
                                    >
                                        {isGlobalAuditing ? 'Аудит...' : 'Повний Блокчейн-аудит'}
                                    </Button>
                                )}
                            </Box>

                            {selectedRequest?.id && (
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        {renderHashWithCheck('Офіційна заявка', selectedRequest?.pdfHash, 'service_request', selectedRequest.id)}
                                        {renderHashWithCheck('Акт виконаних робіт', selectedRequest?.workReportPdfHash, 'work_report', selectedRequest.id)}
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        {renderHashWithCheck('Акт технічного огляду', selectedRequest?.inspectionPdfHash, 'inspection_report', selectedRequest.id)}
                                        {renderHashWithCheck('Фіскальний чек / Завдаток', selectedRequest?.paymentReceiptPdfHash, 'deposit_receipt', selectedRequest.id)}
                                    </Grid>
                                </Grid>
                            )}
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedRequest(null)} variant="contained" size="large">Закрити</Button>
                </DialogActions>
            </Dialog>

            {/* Use the extracted component */}
            <IntegrityResultDialog
                open={openIntegrityModal}
                onClose={() => setOpenIntegrityModal(false)}
                result={integrityResult}
            />
        </Box>
    );
}