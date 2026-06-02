import { useEffect, useState, type JSX } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Card, CardContent, Chip,
    CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PolicyIcon from '@mui/icons-material/Policy';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import GppBadIcon from '@mui/icons-material/GppBad';

import api from '../../services/api';
import type { ServiceRequest, IntegrityResult, StoProfile } from '../../types';

import RequestInfo from './components/RequestInfo';
import RequestDocuments from './components/RequestDocuments';
import RequestTimeline from './components/RequestTimeline';
import PaymentModal from './components/PaymentModal';
import CancelRequestModal from './components/CancelRequestModal';

// ============================================================================
// TYPES
// ============================================================================

interface ExtendedServiceRequest extends ServiceRequest {
    manager?: { firstName: string; lastName: string; phoneNumber?: string };
    mechanic?: string;
    arrivalInstructions?: string;
    finalReceiptPdfHash?: string;
    sto?: StoProfile;
}

interface ApiErrorResponse {
    response?: {
        data?: IntegrityResult | { message: string };
    };
}

type ChipColor = "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";

// ============================================================================
// SUB-COMPONENTS (Local)
// ============================================================================

/**
 * Sub-component to display the result of a Blockchain Integrity Audit.
 */
const IntegrityResultDialog = ({ open, onClose, result }: { open: boolean; onClose: () => void; result: IntegrityResult | null; }): JSX.Element => (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', bgcolor: result?.valid ? 'success.main' : 'error.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
            {result?.valid ? <VerifiedUserIcon /> : <GppBadIcon />} Результат перевірки Blockchain
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: result?.valid ? 'success.main' : 'error.main', fontWeight: 'bold' }}>{result?.message}</Typography>
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RequestDetails(): JSX.Element {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Data State
    const [req, setReq] = useState<ExtendedServiceRequest | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // Modal States
    const [openCancelModal, setOpenCancelModal] = useState<boolean>(false);
    const [openPaymentModal, setOpenPaymentModal] = useState<boolean>(false);
    const [openIntegrityModal, setOpenIntegrityModal] = useState<boolean>(false);

    // Audit State
    const [integrityResult, setIntegrityResult] = useState<IntegrityResult | null>(null);
    const [verifyingDoc, setVerifyingDoc] = useState<string>('');
    const [isGlobalAuditing, setIsGlobalAuditing] = useState<boolean>(false);

    useEffect(() => {
        api.get<ExtendedServiceRequest>(`/service-requests/${id}`)
            .then(res => setReq(res.data))
            .catch(err => {
                console.error(err);
                setError('Не вдалося завантажити деталі заявки.');
            })
            .finally(() => setLoading(false));
    }, [id]);

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

    const handleViewPdf = async (docType: string) => {
        if (!req) return;
        try {
            const response = await api.get(`/service-requests/${req.id}/document/${docType}`, { responseType: 'blob' });
            const file = new Blob([response.data as BlobPart], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');
        } catch (err) {
            console.error("Помилка завантаження PDF:", err);
            alert('Не вдалося завантажити документ. Можливо, у вас немає доступу.');
        }
    };

    const handlePaymentSuccess = (receiptPdfHash: string, txHash: string) => {
        if (!req) return;
        setReq({
            ...req,
            status: 'DepositPaid',
            paymentReceiptPdfHash: receiptPdfHash,
            statusHistory: req.statusHistory ? [
                ...req.statusHistory,
                { status: 'DepositPaid', changedAt: new Date().toISOString(), blockchainTxHash: txHash }
            ] : []
        });
        setOpenPaymentModal(false);
    };

    const handleCancelSuccess = () => {
        if (req) setReq({ ...req, status: 'CANCELLED' });
        setOpenCancelModal(false);
    };

    const getStatusColor = (status: string): ChipColor => {
        switch (status) {
            case 'RequestCreated':
            case 'AcceptedByAdmin':
            case 'VehicleArrived': return 'warning';
            case 'Inspected': return 'secondary';
            case 'DepositPaid':
            case 'WorkInProgress': return 'info';
            case 'ReadyForPickup':
            case 'Finalized': return 'success';
            case 'Canceled':
            case 'CANCELLED': return 'error';
            default: return 'default';
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ mt: 4, mx: 'auto', maxWidth: 600 }}>{error}</Alert>;
    if (!req) return <Alert severity="warning" sx={{ mt: 4, mx: 'auto', maxWidth: 600 }}>Заявку не знайдено</Alert>;

    const canCancel = ['RequestCreated', 'PENDING', 'AcceptedByAdmin', 'VehicleArrived'].includes(req.status);
    const allowedCommentStatuses = ['AcceptedByAdmin', 'WorkInProgress', 'ReadyForPickup', 'CANCELLED'];
    const shouldShowComment = allowedCommentStatuses.includes(req.status) && !!req.arrivalInstructions;
    const activeServiceStatuses = ['AcceptedByAdmin', 'VehicleArrived', 'Inspected', 'DepositPaid', 'ReadyForRepair', 'WorkInProgress', 'ReadyForPickup'];
    const showManagerContact = activeServiceStatuses.includes(req.status);

    return (
        <Box sx={{ width: '100%', maxWidth: 1000, mx: 'auto', mt: 4, px: 3, pb: 6 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 3 }}>
                Повернутися назад
            </Button>

            <Card elevation={3} sx={{ borderRadius: 2 }}>
                {/* Header Section */}
                <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <AssignmentIcon fontSize="large" />
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Заявка #{req.id}</Typography>
                            <Typography variant="subtitle2">Створена: {new Date(req.createdAt).toLocaleString('uk-UA')}</Typography>
                        </Box>
                    </Box>
                    <Chip label={req.status} color={getStatusColor(req.status)} sx={{ fontWeight: 'bold', bgcolor: 'white', color: `${getStatusColor(req.status)}.main` }} />
                </Box>

                {/* Actions Toolbar */}
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, borderBottom: '1px solid #eee' }}>
                    {canCancel && (
                        <Button variant="outlined" color="error" sx={{ '&:hover': { bgcolor: '#ffebee' } }} onClick={() => setOpenCancelModal(true)}>
                            Скасувати заявку
                        </Button>
                    )}
                    {req.status === 'Inspected' && req.depositAmount !== undefined && req.depositAmount > 0 && (
                        <Button variant="contained" color="success" onClick={() => setOpenPaymentModal(true)} sx={{ fontWeight: 'bold' }}>
                            Оплатити завдаток ({req.depositAmount} UAH)
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={isGlobalAuditing ? <CircularProgress size={20} /> : <PolicyIcon />}
                        onClick={() => { void handleGlobalAudit(); }}
                        disabled={isGlobalAuditing || !req.blockchainJobId}
                        sx={{ ml: 'auto' }}
                    >
                        {isGlobalAuditing ? 'Аудит...' : 'Блокчейн-аудит заявки'}
                    </Button>
                </Box>

                <CardContent sx={{ p: 4 }}>
                    <RequestInfo req={req} showManagerContact={showManagerContact} shouldShowComment={shouldShowComment} />

                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, mt: 4 }}>Історія статусів (Audit Trail):</Typography>
                    <RequestTimeline history={req.statusHistory} />

                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, mt: 4 }}>Документи та Аудит:</Typography>
                    <RequestDocuments req={req} verifyingDoc={verifyingDoc} onViewPdf={(doc) => { void handleViewPdf(doc); }} onVerify={(doc) => { void handleVerifyIntegrity(doc); }} />
                </CardContent>
            </Card>

            {/* Modals */}
            <IntegrityResultDialog open={openIntegrityModal} onClose={() => setOpenIntegrityModal(false)} result={integrityResult} />
            <CancelRequestModal open={openCancelModal} onClose={() => setOpenCancelModal(false)} reqId={req.id} onSuccess={handleCancelSuccess} />
            <PaymentModal open={openPaymentModal} onClose={() => setOpenPaymentModal(false)} reqId={req.id} depositAmount={req.depositAmount} onSuccess={handlePaymentSuccess} />
        </Box>
    );
}