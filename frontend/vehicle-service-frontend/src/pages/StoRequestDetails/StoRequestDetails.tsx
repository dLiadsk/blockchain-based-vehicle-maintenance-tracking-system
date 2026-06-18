import React, { useState, useEffect, type JSX } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Paper, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Chip, Alert, CircularProgress, Card, CardContent, Divider
} from '@mui/material';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BuildIcon from '@mui/icons-material/Build';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PaymentIcon from '@mui/icons-material/Payment';
import PolicyIcon from '@mui/icons-material/Policy';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import GppBadIcon from '@mui/icons-material/GppBad';

// Services & Types
import api from '../../services/api';
import type { ServiceRequest, IntegrityResult, StoProfile } from '../../types';

// Sub-components
import StoRequestInfo from './components/StoRequestInfo';
import StoRequestDocuments from './components/StoRequestDocuments';
import InspectModal from './components/InspectModal';
import CompleteRepairModal from './components/CompleteRepairModal';

// ============================================================================
// TYPES
// ============================================================================

interface StoExtendedRequest extends ServiceRequest {
    customer?: { firstName: string; lastName: string; email: string; phoneNumber?: string };
    mechanicName?: string;
    arrivalInstructions?: string;
    sto?: StoProfile;
    finalReceiptPdfHash?: string;
    history?: { status: string; timestamp: string; txHash?: string }[];
}

type ModalType = 'APPROVE' | 'INSPECT' | 'COMPLETE' | 'CANCEL' | 'CONFIRM_PAYMENT' | 'START_REPAIR' | 'FINALIZE' | null;

interface ApiErrorResponse {
    response?: {
        data?: IntegrityResult | { message: string };
    };
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Main dashboard for managing a specific service request from the STO perspective.
 * Orchestrates data fetching, document viewing, blockchain audits, and state transitions.
 */
export default function StoRequestDetails(): JSX.Element {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Data States
    const [req, setReq] = useState<StoExtendedRequest | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // Modal & Action States
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // Form States for Simple Inline Modals
    const [approveMsg, setApproveMsg] = useState<string>('Чекаємо вас завтра о 10:00.');
    const [startRepairMsg, setStartRepairMsg] = useState<string>('Орієнтовний час завершення: ');
    const [cancelReason, setCancelReason] = useState<string>('');

    // Blockchain Audit States
    const [integrityResult, setIntegrityResult] = useState<IntegrityResult | null>(null);
    const [openIntegrityModal, setOpenIntegrityModal] = useState<boolean>(false);
    const [verifyingDoc, setVerifyingDoc] = useState<string>('');
    const [isGlobalAuditing, setIsGlobalAuditing] = useState<boolean>(false);

    /**
     * Fetches the latest data for the service request.
     */
    const fetchRequestDetails = async () => {
        try {
            const response = await api.get<StoExtendedRequest>(`/service-requests/${id}`);
            setReq(response.data);
        } catch (err) {
            console.error(err);
            setError('Не вдалося завантажити деталі заявки');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchRequestDetails();
    }, [id]);

    /**
     * Generic handler for simple API actions (Approve, Cancel, Start Repair, etc.).
     * Executes the request, refreshes data, and closes the modal.
     */
    const handleAction = async (endpoint: string, payload?: any, method: 'post' | 'put' = 'post') => {
        setActionLoading(true);
        try {
            if (method === 'put') {
                await api.put(endpoint, payload);
            } else {
                await api.post(endpoint, payload);
            }
            await fetchRequestDetails();
            setActiveModal(null);
        } catch (err) {
            console.error("Action execution failed", err);
            alert("Сталася помилка. Перевірте консоль.");
        } finally {
            setActionLoading(false);
        }
    };

    /**
     * Downloads and opens a PDF document in a new tab.
     */
    const handleViewDocument = async (docType: string) => {
        try {
            const response = await api.get(`/service-requests/${id}/document/${docType}`, { responseType: 'blob' });
            const file = new Blob([response.data as BlobPart], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');
        } catch (err) {
            console.error("Failed to load document", err);
            alert("Не вдалося завантажити документ. Можливо, у вас немає доступу.");
        }
    };

    /**
     * Triggers a blockchain integrity check for a specific document.
     */
    const handleVerifyIntegrity = async (docType: string) => {
        setVerifyingDoc(docType);
        try {
            const response = await api.get<IntegrityResult>(`/service-requests/${id}/verify-integrity/${docType}`);
            setIntegrityResult(response.data);
            setOpenIntegrityModal(true);
        } catch (err) {
            const apiError = err as ApiErrorResponse;
            setIntegrityResult(apiError.response?.data as IntegrityResult || { valid: false, message: 'Помилка з\'єднання з сервером' });
            setOpenIntegrityModal(true);
        } finally {
            setVerifyingDoc('');
        }
    };

    /**
     * Triggers a full blockchain audit for the entire service request lifecycle.
     */
    const handleGlobalAudit = async () => {
        setIsGlobalAuditing(true);
        try {
            const response = await api.get<IntegrityResult>(`/audit/verify-job/${id}`);
            setIntegrityResult(response.data);
            setOpenIntegrityModal(true);
        } catch (err) {
            const apiError = err as ApiErrorResponse;
            setIntegrityResult(apiError.response?.data as IntegrityResult || { valid: false, message: 'Помилка з\'єднання з сервером аудиту' });
            setOpenIntegrityModal(true);
        } finally {
            setIsGlobalAuditing(false);
        }
    };

    /**
     * Dynamically renders the primary action buttons based on the current request status.
     */
    const renderActionButtons = (): JSX.Element | null => {
        if (!req) return null;

        const canCancel = ['RequestCreated', 'PENDING', 'AcceptedByAdmin', 'VehicleArrived'].includes(req.status);
        const cancelButton = canCancel ? (
            <Button variant="outlined" color="error" size="large" onClick={() => setActiveModal('CANCEL')}>
                Скасувати заявку
            </Button>
        ) : null;

        let primaryButton: JSX.Element | null = null;

        switch (req.status) {
            case 'RequestCreated':
            case 'PENDING':
                primaryButton = <Button variant="contained" color="success" size="large" onClick={() => setActiveModal('APPROVE')}>Підтвердити заявку</Button>;
                break;
            case 'AcceptedByAdmin':
                primaryButton = <Button variant="contained" color="primary" size="large" startIcon={<DirectionsCarIcon />} onClick={() => { void handleAction(`/sto/mark-arrival/${req.id}`); }}>Зафіксувати прибуття авто</Button>;
                break;
            case 'VehicleArrived':
                primaryButton = <Button variant="contained" color="warning" size="large" startIcon={<AssignmentIcon />} onClick={() => setActiveModal('INSPECT')}>Провести технічний огляд</Button>;
                break;
            case 'Inspected':
                primaryButton = <Button variant="contained" color="success" size="large" startIcon={<PaymentIcon />} onClick={() => setActiveModal('CONFIRM_PAYMENT')}>Підтвердити оплату завдатка (Готівка)</Button>;
                break;
            case 'DepositPaid':
            case 'ReadyForRepair':
                primaryButton = <Button variant="contained" color="error" size="large" startIcon={<BuildIcon />} onClick={() => setActiveModal('START_REPAIR')}>Розпочати ремонт</Button>;
                break;
            case 'WorkInProgress':
                primaryButton = <Button variant="contained" color="info" size="large" startIcon={<CheckCircleIcon />} onClick={() => setActiveModal('COMPLETE')}>Завершити ремонт</Button>;
                break;
            case 'ReadyForPickup':
                primaryButton = <Button variant="contained" color="success" size="large" onClick={() => setActiveModal('FINALIZE')}>Віддати авто (Розрахунок завершено)</Button>;
                break;
            default:
                primaryButton = <Alert severity="info" sx={{ width: '100%' }}>Активних дій для цього статусу немає.</Alert>;
        }

        return (
            <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                {primaryButton}
                {cancelButton}
            </Box>
        );
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ mt: 4, mx: 'auto', maxWidth: 800 }}>{error}</Alert>;
    if (!req) return <Alert severity="warning" sx={{ mt: 4, mx: 'auto', maxWidth: 800 }}>Заявку не знайдено</Alert>;

    return (
        <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
                Повернутися до списку
            </Button>

            <Card elevation={3}>
                <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Управління заявкою #{req.id}</Typography>
                    <Chip label={req.status} sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 'bold' }} />
                </Box>

                {/* Audit Toolbar */}
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, borderBottom: '1px solid #eee', bgcolor: 'grey.50' }}>
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={isGlobalAuditing ? <CircularProgress size={20} /> : <PolicyIcon />}
                        onClick={() => { void handleGlobalAudit(); }}
                        disabled={isGlobalAuditing || !req.blockchainJobId}
                    >
                        {isGlobalAuditing ? 'Аудит...' : 'Блокчейн-аудит заявки'}
                    </Button>
                </Box>

                <CardContent sx={{ p: 4 }}>

                    {/* Information Section (Extracted) */}
                    <StoRequestInfo req={req} />

                    <Divider sx={{ my: 4 }} />

                    {/* Documents & Audit Section (Extracted) */}
                    <StoRequestDocuments
                        req={req}
                        verifyingDoc={verifyingDoc}
                        onViewPdf={handleViewDocument}
                        onVerify={handleVerifyIntegrity}
                    />

                    {/* Status History (Blockchain trail) */}
                    {req.history && req.history.length > 0 && (
                        <Box sx={{ mt: 4 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Історія змін та Блокчейн-транзакції</Typography>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                                {req.history.map((item, idx) => (
                                    <Box key={idx} sx={{
                                        mb: idx !== req.history!.length - 1 ? 2 : 0,
                                        pb: idx !== req.history!.length - 1 ? 2 : 0,
                                        borderBottom: idx !== req.history!.length - 1 ? '1px solid #e0e0e0' : 'none'
                                    }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{item.status}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(item.timestamp).toLocaleString('uk-UA')}
                                        </Typography>
                                        {item.txHash && (
                                            <Typography variant="caption" sx={{ display: 'block', wordBreak: 'break-all', fontFamily: 'monospace', color: 'primary.main', mt: 0.5 }}>
                                                Tx Hash: {item.txHash}
                                            </Typography>
                                        )}
                                    </Box>
                                ))}
                            </Paper>
                        </Box>
                    )}

                    <Divider sx={{ mt: 4, mb: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        {renderActionButtons()}
                    </Box>
                </CardContent>
            </Card>

            {/* ========================================== */}
            {/* INLINE MODALS (Simple Confirmations)       */}
            {/* ========================================== */}

            {/* Integrity Check Result Modal */}
            <Dialog open={openIntegrityModal} onClose={() => setOpenIntegrityModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold', bgcolor: integrityResult?.valid ? 'success.main' : 'error.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                    {integrityResult?.valid ? <VerifiedUserIcon /> : <GppBadIcon />} Результат перевірки Blockchain
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: integrityResult?.valid ? 'success.main' : 'error.main', fontWeight: 'bold' }}>{integrityResult?.message}</Typography>
                    <Typography variant="subtitle2" color="text.secondary">Дані Блокчейну (Source of Truth):</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', mb: 2, bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                        {integrityResult?.originalBlockchainHash || 'Не знайдено'}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary">Локальні дані (БД / Файл):</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', bgcolor: integrityResult?.valid ? 'success.50' : 'error.50', color: integrityResult?.valid ? 'success.dark' : 'error.dark', p: 1, borderRadius: 1 }}>
                        {integrityResult?.currentFileHash || 'Помилка читання'}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenIntegrityModal(false)} size="large">Закрити</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={activeModal === 'APPROVE'} onClose={() => setActiveModal(null)} fullWidth>
                <DialogTitle>Підтвердити заявку</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" sx={{ mb: 2 }}>Вкажіть інструкції для клієнта (наприклад, дату та час, коли потрібно привезти авто).</Typography>
                    <TextField fullWidth multiline rows={3} label="Повідомлення для клієнта" value={approveMsg} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApproveMsg(e.target.value)} />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setActiveModal(null)}>Скасувати</Button>
                    <Button disabled={actionLoading} variant="contained" color="success" onClick={() => { void handleAction(`/sto/approve/${req.id}`, { message: approveMsg }); }}>Підтвердити візит</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={activeModal === 'CANCEL'} onClose={() => setActiveModal(null)} fullWidth>
                <DialogTitle color="error">Скасувати заявку</DialogTitle>
                <DialogContent dividers>
                    <TextField fullWidth required multiline rows={3} label="Причина скасування" value={cancelReason} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCancelReason(e.target.value)} />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setActiveModal(null)}>Назад</Button>
                    <Button disabled={actionLoading || !cancelReason.trim()} variant="contained" color="error" onClick={() => { void handleAction(`/service-requests/${req.id}/cancel`, { reason: cancelReason }, 'put'); }}>Скасувати назавжди</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={activeModal === 'CONFIRM_PAYMENT'} onClose={() => setActiveModal(null)} fullWidth>
                <DialogTitle color="success.main">Підтвердження оплати</DialogTitle>
                <DialogContent dividers>
                    <Alert severity="warning">
                        Ви підтверджуєте, що клієнт вніс завдаток у розмірі <strong>{req.depositAmount || 0} UAH</strong>?
                        Цю дію неможливо скасувати.
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setActiveModal(null)}>Скасувати</Button>
                    <Button disabled={actionLoading} variant="contained" color="success" onClick={() => { void handleAction(`/sto/confirm-payment/${req.id}`); }}>Так, гроші отримано</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={activeModal === 'START_REPAIR'} onClose={() => setActiveModal(null)} fullWidth>
                <DialogTitle>Розпочати ремонт</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" sx={{ mb: 2 }}>Напишіть клієнту, коли орієнтовно будуть завершені роботи.</Typography>
                    <TextField fullWidth multiline rows={2} label="Повідомлення (Орієнтовний час)" value={startRepairMsg} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartRepairMsg(e.target.value)} />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setActiveModal(null)}>Скасувати</Button>
                    <Button disabled={actionLoading} variant="contained" color="error" onClick={() => { void handleAction(`/sto/start-repair/${req.id}`, { message: startRepairMsg }); }}>Взяти в роботу</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={activeModal === 'FINALIZE'} onClose={() => setActiveModal(null)} fullWidth>
                <DialogTitle color="success.main">Підтвердження завершення</DialogTitle>
                <DialogContent dividers>
                    <Alert severity="info">
                        Ви підтверджуєте, що клієнт повністю розрахувався, і ви віддаєте йому автомобіль?
                        Після цього заявка перейде у фінальний закритий статус.
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setActiveModal(null)}>Скасувати</Button>
                    <Button disabled={actionLoading} variant="contained" color="success" onClick={() => { void handleAction(`/sto/finalize/${req.id}`); }}>Так, розрахунок завершено</Button>
                </DialogActions>
            </Dialog>

            {/* ========================================== */}
            {/* EXTRACTED COMPLEX MODALS                   */}
            {/* ========================================== */}

            <InspectModal
                open={activeModal === 'INSPECT'}
                onClose={() => setActiveModal(null)}
                reqId={req.id}
                initialMileage={req.mileage ? req.mileage.toString() : (req.vehicle?.mileage?.toString() || '')}
                initialWorkTypes={req.workTypes || []}
                onAction={handleAction}
                actionLoading={actionLoading}
            />

            <CompleteRepairModal
                open={activeModal === 'COMPLETE'}
                onClose={() => setActiveModal(null)}
                reqId={req.id}
                onAction={handleAction}
                actionLoading={actionLoading}
            />

        </Box>
    );
}