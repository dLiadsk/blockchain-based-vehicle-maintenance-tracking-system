import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Chip, Alert, CircularProgress, Grid, Divider, Card, CardContent, Autocomplete, IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BuildIcon from '@mui/icons-material/Build';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PaymentIcon from '@mui/icons-material/Payment';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PolicyIcon from '@mui/icons-material/Policy';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import GppBadIcon from '@mui/icons-material/GppBad';
import api from '../services/api';

export default function StoRequestDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [req, setReq] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Розширені стани для модалок дій
    const [activeModal, setActiveModal] = useState<'APPROVE' | 'INSPECT' | 'COMPLETE' | 'CANCEL' | 'CONFIRM_PAYMENT' | 'START_REPAIR' | 'FINALIZE' | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Стейт для аудиту та перевірок
    const [integrityResult, setIntegrityResult] = useState<any>(null);
    const [openIntegrityModal, setOpenIntegrityModal] = useState(false);
    const [verifyingDoc, setVerifyingDoc] = useState('');
    const [isGlobalAuditing, setIsGlobalAuditing] = useState(false);

    // Дані форм та повідомлень
    const [approveMsg, setApproveMsg] = useState('Чекаємо вас завтра о 10:00.');
    const [startRepairMsg, setStartRepairMsg] = useState('Орієнтовний час завершення: ');
    const [completeMsg, setCompleteMsg] = useState('Ваше авто готове! Можете забирати сьогодні до 18:00.');
    const [cancelReason, setCancelReason] = useState('');

    const [inspectionForm, setInspectionForm] = useState({
        mileage: '', findings: '', total: '', deposit: '', workTypes: [] as string[]
    });

    const [completeForm, setCompleteForm] = useState({ mechanic: '' });
    const [workItems, setWorkItems] = useState([
        { description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }
    ]);

    const calculateFinalTotal = () => {
        return workItems.reduce((acc, item) => acc + item.totalPrice, 0);
    };

    const handleWorkItemChange = (index: number, field: string, value: string) => {
        const newItems = [...workItems];
        if (field === 'description') {
            newItems[index].description = value;
        } else {
            const numValue = parseFloat(value) || 0;
            // @ts-ignore
            newItems[index][field] = numValue;
            newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
        }
        setWorkItems(newItems);
    };

    const addWorkItemRow = () => {
        setWorkItems([...workItems, { description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
    };

    const removeWorkItemRow = (index: number) => {
        setWorkItems(workItems.filter((_, i) => i !== index));
    };

    const fetchRequestDetails = async () => {
        try {
            const response = await api.get(`/service-requests/${id}`);
            setReq(response.data);
            if (response.data) {
                setInspectionForm(prev => ({
                    ...prev,
                    mileage: response.data.mileage ? response.data.mileage.toString() : '',
                    workTypes: response.data.workTypes || []
                }));
            }
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

    const handleViewDocument = async (docType: string) => {
        try {
            const response = await api.get(`/service-requests/${id}/document/${docType}`, {
                responseType: 'blob'
            });
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');
        } catch (err) {
            console.error("Помилка завантаження документа", err);
            alert("Не вдалося завантажити документ. Можливо, у вас немає доступу.");
        }
    };

    // БЛОКЧЕЙН ФУНКЦІЇ АУДИТУ
    const handleVerifyIntegrity = async (docType: string) => {
        setVerifyingDoc(docType);
        try {
            const response = await api.get(`/service-requests/${id}/verify-integrity/${docType}`);
            setIntegrityResult(response.data);
            setOpenIntegrityModal(true);
        } catch (error: any) {
            setIntegrityResult(error.response?.data || { valid: false, message: 'Помилка з\'єднання з сервером' });
            setOpenIntegrityModal(true);
        } finally {
            setVerifyingDoc('');
        }
    };

    const handleGlobalAudit = async () => {
        setIsGlobalAuditing(true);
        try {
            const response = await api.get(`/audit/verify-job/${id}`);
            setIntegrityResult(response.data);
            setOpenIntegrityModal(true);
        } catch (error: any) {
            setIntegrityResult(error.response?.data || { valid: false, message: 'Помилка з\'єднання з сервером аудиту' });
            setOpenIntegrityModal(true);
        } finally {
            setIsGlobalAuditing(false);
        }
    };


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
            console.error("Помилка виконання дії", err);
            alert("Сталася помилка. Перевірте консоль.");
        } finally {
            setActionLoading(false);
        }
    };

    const renderActionButtons = () => {
        if (!req) return null;

        const canCancel = ['RequestCreated', 'PENDING', 'AcceptedByAdmin', 'VehicleArrived'].includes(req.status);
        const cancelButton = canCancel ? (
            <Button variant="outlined" color="error" size="large" onClick={() => setActiveModal('CANCEL')}>
                Скасувати заявку
            </Button>
        ) : null;

        let primaryButton = null;

        switch (req.status) {
            case 'RequestCreated':
            case 'PENDING':
                primaryButton = <Button variant="contained" color="success" size="large" onClick={() => setActiveModal('APPROVE')}>Підтвердити заявку</Button>;
                break;
            case 'AcceptedByAdmin':
                primaryButton = <Button variant="contained" color="primary" size="large" startIcon={<DirectionsCarIcon />} onClick={() => handleAction(`/sto/mark-arrival/${req.id}`)}>Зафіксувати прибуття авто</Button>;
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

                {/* ПАНЕЛЬ ІНСТРУМЕНТІВ АУДИТУ */}
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, borderBottom: '1px solid #eee', bgcolor: 'grey.50' }}>
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={isGlobalAuditing ? <CircularProgress size={20} /> : <PolicyIcon />}
                        onClick={handleGlobalAudit}
                        disabled={isGlobalAuditing || !req.blockchainJobId}
                    >
                        {isGlobalAuditing ? 'Аудит...' : 'Блокчейн-аудит заявки'}
                    </Button>
                </Box>

                <CardContent sx={{ p: 4 }}>
                    <Grid container spacing={4}>
                        <Grid size={{xs: 12, sm: 6 }}>
                            <Typography variant="subtitle2" color="text.secondary">Клієнт</Typography>
                            <Typography variant="h6">{req.customer?.firstName} {req.customer?.lastName}</Typography>
                            <Typography variant="body2"><strong>Email:</strong> {req.customer?.email}</Typography>
                            <Typography variant="body2"><strong>Телефон:</strong> {req.customer?.phoneNumber || 'Не вказано'}</Typography>
                        </Grid>

                        <Grid size={{xs: 12, sm: 6 }}>
                            <Typography variant="subtitle2" color="text.secondary">Автомобіль</Typography>
                            <Typography variant="h6">{req.vehicle?.brand} {req.vehicle?.model}</Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>VIN: {req.vehicle?.vin}</Typography>
                            <Box sx={{ bgcolor: 'grey.50', p: 1.5, borderRadius: 1, display: 'inline-block' }}>
                                <Typography variant="body2">
                                    <strong>Пробіг (при створенні заявки):</strong> {req.mileage ? `${req.mileage} км` : 'Не вказано'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Пробіг (базовий з профілю авто):</strong> {req.vehicle?.mileage ? `${req.vehicle?.mileage} км` : 'Не вказано'}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid size={{xs: 12}}>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Опис проблеми від клієнта</Typography>
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                                {req.description || 'Клієнт не залишив коментарів.'}
                            </Typography>
                        </Grid>

                        {req.arrivalInstructions && (
                            <Grid size={{xs: 12}}>
                                <Typography variant="subtitle2" color="primary.main" gutterBottom>Поточне повідомлення для клієнта (від СТО)</Typography>
                                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', bgcolor: 'primary.50', p: 2, borderRadius: 1, borderLeft: '4px solid', borderColor: 'primary.main' }}>
                                    {req.arrivalInstructions}
                                </Typography>
                            </Grid>
                        )}

                        {req.mechanicName && (
                            <Grid size={{xs: 12}}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Відповідальний майстер</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                                    <BuildIcon sx={{ fontSize: 18, verticalAlign: 'sub', mr: 1 }} />
                                    {req.mechanicName}
                                </Typography>
                            </Grid>
                        )}

                        <Grid size={{xs: 12, sm: 6 }}>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.50', borderColor: 'success.light' }}>
                                <Typography variant="subtitle2" color="success.dark">Загальна вартість ремонту</Typography>
                                <Typography variant="h5" color="success.main" sx={{ fontWeight: 'bold' }}>{req.totalAmount || 0} UAH</Typography>
                            </Paper>
                        </Grid>

                        <Grid size={{xs: 12, sm: 6 }}>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'warning.50', borderColor: 'warning.light' }}>
                                <Typography variant="subtitle2" color="warning.dark">Сплачений / Очікуваний завдаток</Typography>
                                <Typography variant="h5" color="warning.main" sx={{ fontWeight: 'bold' }}>{req.depositAmount || 0} UAH</Typography>
                            </Paper>
                        </Grid>

                        {/* ОНОВЛЕНИЙ БЛОК: ДОКУМЕНТИ ТА АУДИТ */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Документи та Аудит:</Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>

                                {req.pdfHash && (
                                    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Офіційна заявка на СТО</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', mb: 2, wordBreak: 'break-all' }}>SHA-256: {req.pdfHash}</Typography>
                                        <Button variant="outlined" color="primary" startIcon={<PictureAsPdfIcon />} sx={{ mt: 'auto', mb: 1 }} onClick={() => handleViewDocument('service_request')}>Переглянути PDF</Button>
                                        <Button variant="contained" color="secondary" startIcon={<SecurityIcon />} onClick={() => handleVerifyIntegrity('service_request')} disabled={verifyingDoc === 'service_request'}>
                                            {verifyingDoc === 'service_request' ? 'Перевірка...' : 'Перевірити цілісність'}
                                        </Button>
                                    </Box>
                                )}

                                {req.inspectionPdfHash && (
                                    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Акт технічного огляду</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', mb: 2, wordBreak: 'break-all' }}>SHA-256: {req.inspectionPdfHash}</Typography>
                                        <Button variant="outlined" color="info" startIcon={<PictureAsPdfIcon />} sx={{ mt: 'auto', mb: 1 }} onClick={() => handleViewDocument('inspection_report')}>Переглянути PDF</Button>
                                        <Button variant="contained" color="secondary" startIcon={<SecurityIcon />} onClick={() => handleVerifyIntegrity('inspection_report')} disabled={verifyingDoc === 'inspection_report'}>
                                            {verifyingDoc === 'inspection_report' ? 'Перевірка...' : 'Перевірити цілісність'}
                                        </Button>
                                    </Box>
                                )}

                                {req.paymentReceiptPdfHash && (
                                    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Квитанція (Завдаток)</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', mb: 2, wordBreak: 'break-all' }}>SHA-256: {req.paymentReceiptPdfHash}</Typography>
                                        <Button variant="outlined" color="warning" startIcon={<PictureAsPdfIcon />} sx={{ mt: 'auto', mb: 1 }} onClick={() => handleViewDocument('deposit_receipt')}>Переглянути PDF</Button>
                                        <Button variant="contained" color="secondary" startIcon={<SecurityIcon />} onClick={() => handleVerifyIntegrity('deposit_receipt')} disabled={verifyingDoc === 'deposit_receipt'}>
                                            {verifyingDoc === 'deposit_receipt' ? 'Перевірка...' : 'Перевірити цілісність'}
                                        </Button>
                                    </Box>
                                )}

                                {req.workReportPdfHash && (
                                    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Акт виконаних робіт</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', mb: 2, wordBreak: 'break-all' }}>SHA-256: {req.workReportPdfHash}</Typography>
                                        <Button variant="contained" color="info" startIcon={<PictureAsPdfIcon />} sx={{ mt: 'auto', mb: 1 }} onClick={() => handleViewDocument('work_report')}>Переглянути PDF</Button>
                                        <Button variant="contained" color="secondary" startIcon={<SecurityIcon />} onClick={() => handleVerifyIntegrity('work_report')} disabled={verifyingDoc === 'work_report'}>
                                            {verifyingDoc === 'work_report' ? 'Перевірка...' : 'Перевірити цілісність'}
                                        </Button>
                                    </Box>
                                )}

                                {req.finalReceiptPdfHash && (
                                    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Фінальний чек розрахунку</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', mb: 2, wordBreak: 'break-all' }}>SHA-256: {req.finalReceiptPdfHash}</Typography>
                                        <Button variant="contained" color="success" startIcon={<PictureAsPdfIcon />} sx={{ mt: 'auto', mb: 1 }} onClick={() => handleViewDocument('final_settlement')}>Переглянути PDF</Button>
                                        <Button variant="contained" color="secondary" startIcon={<SecurityIcon />} onClick={() => handleVerifyIntegrity('final_settlement')} disabled={verifyingDoc === 'final_settlement'}>
                                            {verifyingDoc === 'final_settlement' ? 'Перевірка...' : 'Перевірити цілісність'}
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        </Grid>

                        {/* НОВИЙ БЛОК: ІСТОРІЯ ТА БЛОКЧЕЙН */}
                        {req.history && req.history.length > 0 && (
                            <Grid size={{xs: 12}}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>Історія змін та Блокчейн-транзакції</Typography>
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                                    {req.history.map((item: any, idx: number) => (
                                        <Box key={idx} sx={{
                                            mb: idx !== req.history.length - 1 ? 2 : 0,
                                            pb: idx !== req.history.length - 1 ? 2 : 0,
                                            borderBottom: idx !== req.history.length - 1 ? '1px solid #e0e0e0' : 'none'
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
                            </Grid>
                        )}
                    </Grid>

                    <Divider sx={{ mt: 4, mb: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        {renderActionButtons()}
                    </Box>
                </CardContent>
            </Card>

            {/* --- МОДАЛКА АУДИТУ --- */}
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

            {/* --- ІНШІ МОДАЛЬНІ ВІКНА ДІЙ --- */}

            <Dialog open={activeModal === 'APPROVE'} onClose={() => setActiveModal(null)} fullWidth>
                <DialogTitle>Підтвердити заявку</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" sx={{ mb: 2 }}>Вкажіть інструкції для клієнта (наприклад, дату та час, коли потрібно привезти авто).</Typography>
                    <TextField fullWidth multiline rows={3} label="Повідомлення для клієнта" value={approveMsg} onChange={e => setApproveMsg(e.target.value)} />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setActiveModal(null)}>Скасувати</Button>
                    <Button disabled={actionLoading} variant="contained" color="success" onClick={() => handleAction(`/sto/approve/${req.id}`, { message: approveMsg })}>Підтвердити візит</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={activeModal === 'CANCEL'} onClose={() => setActiveModal(null)} fullWidth>
                <DialogTitle color="error">Скасувати заявку</DialogTitle>
                <DialogContent dividers>
                    <TextField fullWidth required multiline rows={3} label="Причина скасування" value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setActiveModal(null)}>Назад</Button>
                    <Button disabled={actionLoading || !cancelReason.trim()} variant="contained" color="error" onClick={() => handleAction(`/service-requests/${req.id}/cancel`, { reason: cancelReason }, 'put')}>Скасувати назавжди</Button>
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
                    <Button disabled={actionLoading} variant="contained" color="success" onClick={() => handleAction(`/sto/confirm-payment/${req.id}`)}>Так, гроші отримано</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={activeModal === 'START_REPAIR'} onClose={() => setActiveModal(null)} fullWidth>
                <DialogTitle>Розпочати ремонт</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" sx={{ mb: 2 }}>Напишіть клієнту, коли орієнтовно будуть завершені роботи.</Typography>
                    <TextField fullWidth multiline rows={2} label="Повідомлення (Орієнтовний час)" value={startRepairMsg} onChange={e => setStartRepairMsg(e.target.value)} />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setActiveModal(null)}>Скасувати</Button>
                    <Button disabled={actionLoading} variant="contained" color="error" onClick={() => handleAction(`/sto/start-repair/${req.id}`, { message: startRepairMsg })}>Взяти в роботу</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={activeModal === 'INSPECT'} onClose={() => setActiveModal(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Результати технічного огляду</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        <Grid size={{xs: 12}}>
                            <TextField fullWidth required type="number" label="Оновлений/Точний пробіг (км)" value={inspectionForm.mileage} onChange={e => setInspectionForm({...inspectionForm, mileage: e.target.value})} />
                        </Grid>
                        <Grid size={{xs: 12}}>
                            <TextField fullWidth required multiline rows={3} label="Знайдені дефекти (Висновки)" value={inspectionForm.findings} onChange={e => setInspectionForm({...inspectionForm, findings: e.target.value})} />
                        </Grid>
                        <Grid size={{xs: 12}}>
                            <Autocomplete
                                {...({
                                    multiple: true,
                                    freeSolo: true,
                                    options: [
                                        'Комп\'ютерна діагностика',
                                        'Діагностика ходової',
                                        'Заміна мастила та фільтрів',
                                        'Заміна гальмівних колодок',
                                        'Ремонт двигуна',
                                        'Ремонт АКПП/МКПП',
                                        'Шиномонтаж',
                                        'Розвал-сходження'
                                    ],
                                    value: inspectionForm.workTypes,
                                    onChange: (_: any, newValue: any) => {
                                        setInspectionForm({ ...inspectionForm, workTypes: newValue || [] });
                                    },
                                    renderTags: (value: string[], getTagProps: any) =>
                                        value.map((option: string, index: number) => {
                                            const { key, ...tagProps } = getTagProps({ index });
                                            return (
                                                <Chip key={key} variant="outlined" color="primary" label={option} {...tagProps} />
                                            );
                                        }),
                                    renderInput: (params: any) => (
                                        <TextField {...params} required label="Види робіт" placeholder="Оберіть зі списку або введіть та натисніть Enter" />
                                    )
                                } as any)}
                            />
                        </Grid>
                        <Grid size={{xs: 6}}>
                            <TextField fullWidth required type="number" label="Загальна вартість (UAH)" value={inspectionForm.total} onChange={e => setInspectionForm({...inspectionForm, total: e.target.value})} />
                        </Grid>
                        <Grid size={{xs: 6}}>
                            <TextField fullWidth required type="number" label="Необхідний завдаток (UAH)" value={inspectionForm.deposit} onChange={e => setInspectionForm({...inspectionForm, deposit: e.target.value})} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setActiveModal(null)}>Скасувати</Button>
                    <Button disabled={actionLoading} variant="contained" onClick={() => handleAction(`/sto/inspection/${req.id}`, {
                        currentMileage: parseInt(inspectionForm.mileage),
                        findings: inspectionForm.findings,
                        workTypes: inspectionForm.workTypes,
                        totalAmount: parseFloat(inspectionForm.total),
                        depositAmount: parseFloat(inspectionForm.deposit)
                    })}>Зберегти акт та чекати оплати</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={activeModal === 'COMPLETE'} onClose={() => setActiveModal(null)} maxWidth="md" fullWidth>
                <DialogTitle>Фінальний звіт про ремонт</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        <Grid size={{xs: 12}}>
                            <TextField fullWidth required label="Відповідальний майстер (ПІБ)" placeholder="Наприклад: Іванов Іван" value={completeForm.mechanic} onChange={e => setCompleteForm({...completeForm, mechanic: e.target.value})} />
                        </Grid>
                        <Grid size={{xs: 12}}>
                            <TextField fullWidth multiline rows={2} label="Повідомлення для клієнта (Коли забирати авто)" value={completeMsg} onChange={e => setCompleteMsg(e.target.value)} />
                        </Grid>
                        <Grid size={{xs: 12}}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Виконані роботи та замінені запчастини</Typography>
                            {workItems.map((item, index) => (
                                <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                                    <TextField sx={{ flexGrow: 1 }} label="Опис (робота або деталь)" value={item.description} onChange={(e) => handleWorkItemChange(index, 'description', e.target.value)} size="small" required />
                                    <TextField sx={{ width: '100px' }} label="К-ть" type="number" value={item.quantity} onChange={(e) => handleWorkItemChange(index, 'quantity', e.target.value)} size="small" />
                                    <TextField sx={{ width: '150px' }} label="Ціна за од. (UAH)" type="number" value={item.unitPrice} onChange={(e) => handleWorkItemChange(index, 'unitPrice', e.target.value)} size="small" />
                                    <TextField sx={{ width: '150px' }} label="Сума (UAH)" value={item.totalPrice} size="small" disabled />
                                    <IconButton color="error" onClick={() => removeWorkItemRow(index)} disabled={workItems.length === 1}><DeleteIcon /></IconButton>
                                </Box>
                            ))}
                            <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={addWorkItemRow}>Додати рядок</Button>
                        </Grid>
                        <Grid size={{xs: 12}}>
                            <Paper sx={{ p: 2, bgcolor: 'primary.50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" color="primary.main">Всього до сплати:</Typography>
                                <Typography variant="h5" color="primary.dark" sx={{ fontWeight: 'bold' }}>{calculateFinalTotal()} UAH</Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setActiveModal(null)}>Скасувати</Button>
                    <Button disabled={actionLoading || !completeForm.mechanic || workItems.some(i => !i.description)} variant="contained" color="info" onClick={() => handleAction(`/sto/complete-repair/${req.id}`, {
                        items: workItems, finalTotalAmount: calculateFinalTotal(), mechanicName: completeForm.mechanic, message: completeMsg
                    })}>Згенерувати акт виконаних робіт</Button>
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
                    <Button disabled={actionLoading} variant="contained" color="success" onClick={() => handleAction(`/sto/finalize/${req.id}`)}>Так, розрахунок завершено</Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}