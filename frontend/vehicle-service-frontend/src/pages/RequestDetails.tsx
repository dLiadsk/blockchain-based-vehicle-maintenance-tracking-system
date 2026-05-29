import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Card, CardContent, Chip, CircularProgress, Alert, Grid, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssignmentIcon from '@mui/icons-material/Assignment';
import api from '../services/api';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import Timeline from '@mui/lab/Timeline';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import GppBadIcon from '@mui/icons-material/GppBad';
import SecurityIcon from '@mui/icons-material/Security';


export default function RequestDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isAdmin = localStorage.getItem('userRole') === 'ROLE_ADMIN';

    const [req, setReq] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [openCancelModal, setOpenCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelError, setCancelError] = useState('');
    const [openPaymentModal, setOpenPaymentModal] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [integrityResult, setIntegrityResult] = useState<any>(null);
    const [openIntegrityModal, setOpenIntegrityModal] = useState(false);
    const [verifyingDoc, setVerifyingDoc] = useState('');
    
    useEffect(() => {
        api.get(`/service-requests/${id}`)
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

    const handleOnlinePayment = async () => {
        setIsProcessingPayment(true);
        try {
            // Викликаємо твій метод payOnline на бекенді
            const response = await api.post(`/service-requests/${id}/pay`);

            // Оновлюємо дані на сторінці миттєво, без перезавантаження
            setReq({
                ...req,
                status: 'DepositPaid',
                paymentReceiptPdfHash: response.data.receiptPdfHash, // З'явиться кнопка PDF чеку
                blockchainTxHash: response.data.txHash // Оновиться хеш
            });

            setOpenPaymentModal(false);
        } catch (error) {
            console.error("Помилка оплати:", error);
            setError('Не вдалося провести оплату. Сервер не відповідає.');
        } finally {
            setIsProcessingPayment(false);
        }
    };
    const handleViewPdf = async (docType: string) => {
        try {
            // Робимо запит через axios, вказуючи, що очікуємо файл (blob)
            const response = await api.get(`/service-requests/${req.id}/document/${docType}`, {
                responseType: 'blob'
            });

            // Створюємо тимчасове локальне посилання на завантажений файл
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);

            // Відкриваємо це локальне посилання в новій вкладці
            window.open(fileURL, '_blank');
        } catch (error) {
            console.error("Помилка завантаження PDF:", error);
            setError('Не вдалося завантажити документ. Можливо, у вас немає доступу.');
        }
    };

    const submitCancelRequest = async () => {
        if (!cancelReason.trim()) {
            setCancelError('Будь ласка, вкажіть причину скасування.');
            return;
        }

        setCancelError(''); // Очищаємо помилку перед відправкою

        try {
            await api.put(`/service-requests/${id}/cancel`, { reason: cancelReason });
            setReq({ ...req, status: 'CANCELLED' });
            setOpenCancelModal(false);
            setCancelReason(''); // Очищаємо поле для наступного разу
        } catch (error) {
            console.error("Помилка скасування заявки:", error);
            setCancelError('Не вдалося скасувати заявку. Перевірте консоль для деталей.');
        }
    };
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'warning';
            case 'IN_PROGRESS': return 'info';
            case 'COMPLETED': return 'success';
            case 'CANCELLED': return 'error';
            default: return 'default';
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ mt: 4, mx: 'auto', maxWidth: 600 }}>{error}</Alert>;
    if (!req) return <Alert severity="warning" sx={{ mt: 4, mx: 'auto', maxWidth: 600 }}>Заявку не знайдено</Alert>;

    return (
        <Box sx={{ width: '100%', maxWidth: 1000, mx: 'auto', mt: 4, px: 3, pb: 6 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 3 }}>
                Повернутися назад
            </Button>

            <Card elevation={3} sx={{ borderRadius: 2 }}>
                <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <AssignmentIcon fontSize="large" />
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Заявка #{req.id}</Typography>
                            <Typography variant="subtitle2">
                                Створена: {new Date(req.createdAt).toLocaleString('uk-UA')}
                            </Typography>
                        </Box>
                    </Box>
                    <Chip label={req.status} color={getStatusColor(req.status)} sx={{ fontWeight: 'bold', bgcolor: 'white', color: `${getStatusColor(req.status)}.main` }} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Кнопка скасування з'являється тільки для нових заявок */}
                    {(req.status === 'RequestCreated' || req.status === 'PENDING') && (
                        <Button
                            variant="outlined"
                            color="error"
                            sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#ffebee' } }}
                            onClick={() => setOpenCancelModal(true)}
                        >
                            Скасувати заявку
                        </Button>
                    )}
                    {(req.status === 'PENDING_DEPOSIT') && req.depositAmount > 0 && (
                        <Button
                            variant="contained"
                            color="success"
                            size="large"
                            onClick={() => setOpenPaymentModal(true)}
                            sx={{ fontWeight: 'bold' }}
                        >
                            Оплатити завдаток ({req.depositAmount} UAH)
                        </Button>
                    )}
                    <Chip label={req.status} color={getStatusColor(req.status)} sx={{ fontWeight: 'bold', bgcolor: 'white', color: `${getStatusColor(req.status)}.main` }} />
                </Box>

                <CardContent sx={{ p: 4 }}>
                    <Grid container spacing={4}>
                        {/* Дані про СТО та Авто */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Автомобіль</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                                {req.vehicle?.brand} {req.vehicle?.model}
                            </Typography>

                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Обране СТО</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{req.sto?.stationName}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {req.sto?.city}, {req.sto?.address}
                            </Typography>
                        </Grid>

                        {/* Дані про роботи та вартість */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2, height: '100%' }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Орієнтовна вартість</Typography>
                                <Typography variant="h4" sx={{ color: 'success.main', fontWeight: 'bold', mb: 2 }}>
                                    {req.totalAmount ? `${req.totalAmount} UAH` : 'Очікує оцінки СТО'}
                                </Typography>

                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Дані Блокчейн (Job ID)</Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', color: 'primary.main' }}>
                                    {req.blockchainJobId || 'Очікує створення смарт-контракту'}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 1 }} />
                        </Grid>

                        {/* Опис проблеми */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Опис проблеми:</Typography>
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                {req.description || 'Водій не залишив коментарів.'}
                            </Typography>
                        </Grid>

                        {/* Обрані послуги */}
                        {req.workTypes && req.workTypes.length > 0 && (
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Потрібні роботи:</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {req.workTypes.map((work: string, i: number) => (
                                        <Chip key={i} label={work} variant="outlined" color="primary" />
                                    ))}
                                </Box>
                            </Grid>
                        )}
                        {/* ТАЙМЛАЙН БЛОКЧЕЙН-ІСТОРІЇ */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Історія статусів (Audit Trail):</Typography>
                            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2 }}>
                                <Timeline sx={{
                                    [`& .${timelineItemClasses.root}:before`]: { flex: 0, padding: 0 } // Вирівнюємо по лівому краю
                                }}>
                                    {req.statusHistory && req.statusHistory.map((historyItem: any, index: number) => {
                                        const isLast = index === req.statusHistory.length - 1;
                                        return (
                                            <TimelineItem key={historyItem.id}>
                                                <TimelineSeparator>
                                                    {/* Останній статус світиться основним кольором */}
                                                    <TimelineDot color={isLast ? "primary" : "grey"} />
                                                    {!isLast && <TimelineConnector />}
                                                </TimelineSeparator>
                                                <TimelineContent sx={{ py: '12px', px: 2 }}>
                                                    <Typography variant="subtitle1" component="span" sx={{ fontWeight: 'bold' }}>
                                                        {historyItem.status}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {new Date(historyItem.changedAt).toLocaleString('uk-UA')}
                                                    </Typography>
                                                    {historyItem.blockchainTxHash && (
                                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main', wordBreak: 'break-all' }}>
                                                            Tx: {historyItem.blockchainTxHash}
                                                        </Typography>
                                                    )}
                                                </TimelineContent>
                                            </TimelineItem>
                                        );
                                    })}
                                </Timeline>
                            </Box>
                        </Grid>
                        {/* Блок з документами (PDF) */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Документи та Аудит:</Typography>

                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>

                                {/* Початкова заявка */}
                                {req.pdfHash && (
                                    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Офіційна заявка на СТО</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', mb: 2, wordBreak: 'break-all' }}>
                                            SHA-256: {req.pdfHash}
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            startIcon={<PictureAsPdfIcon />}
                                            sx={{ mt: 'auto' }}
                                            // Зміни URL на адресу твого бекенду
                                            onClick={() => handleViewPdf('service_request')}
                                        >
                                            Переглянути PDF
                                        </Button>
                                        {isAdmin && (
                                            <Button
                                                variant="contained" color="secondary" startIcon={<SecurityIcon />}
                                                onClick={() => handleVerifyIntegrity('service_request')}
                                                disabled={verifyingDoc === 'service_request'}
                                            >
                                                {verifyingDoc === 'service_request' ? 'Перевірка...' : 'Перевірити цілісність'}
                                            </Button>
                                        )}
                                    </Box>
                                )}

                                {/* Акт огляду (Inspection) */}
                                {req.inspectionPdfHash && (
                                    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Акт технічного огляду</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', mb: 2, wordBreak: 'break-all' }}>
                                            SHA-256: {req.inspectionPdfHash}
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            color="info"
                                            startIcon={<PictureAsPdfIcon />}
                                            sx={{ mt: 'auto' }}
                                            onClick={() => handleViewPdf('inspection_report')}
                                        >
                                            Переглянути PDF
                                        </Button>
                                        {isAdmin && (
                                            <Button
                                                variant="contained" color="secondary" startIcon={<SecurityIcon />}
                                                onClick={() => handleVerifyIntegrity('service_request')}
                                                disabled={verifyingDoc === 'service_request'}
                                            >
                                                {verifyingDoc === 'service_request' ? 'Перевірка...' : 'Перевірити цілісність'}
                                            </Button>
                                        )}
                                    </Box>
                                )}

                                {/* Чек про оплату */}
                                {req.paymentReceiptPdfHash && (
                                    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Фіскальний чек / Квитанція</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', mb: 2, wordBreak: 'break-all' }}>
                                            SHA-256: {req.paymentReceiptPdfHash}
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            color="success"
                                            startIcon={<PictureAsPdfIcon />}
                                            sx={{ mt: 'auto' }}
                                            onClick={() => handleViewPdf('deposit_receipt')}
                                        >
                                            Переглянути PDF
                                        </Button>
                                        {isAdmin && (
                                            <Button
                                                variant="contained" color="secondary" startIcon={<SecurityIcon />}
                                                onClick={() => handleVerifyIntegrity('service_request')}
                                                disabled={verifyingDoc === 'service_request'}
                                            >
                                                {verifyingDoc === 'service_request' ? 'Перевірка...' : 'Перевірити цілісність'}
                                            </Button>
                                        )}
                                    </Box>
                                )}

                                {/* Фінальний звіт (Work Report) */}
                                {req.workReportPdfHash && (
                                    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Акт виконаних робіт</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', mb: 2, wordBreak: 'break-all' }}>
                                            SHA-256: {req.workReportPdfHash}
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            startIcon={<PictureAsPdfIcon />}
                                            sx={{ mt: 'auto' }}
                                            onClick={() => handleViewPdf('work_report')}
                                        >
                                            Переглянути PDF
                                        </Button>
                                        {isAdmin && (
                                            <Button
                                                variant="contained" color="secondary" startIcon={<SecurityIcon />}
                                                onClick={() => handleVerifyIntegrity('service_request')}
                                                disabled={verifyingDoc === 'service_request'}
                                            >
                                                {verifyingDoc === 'service_request' ? 'Перевірка...' : 'Перевірити цілісність'}
                                            </Button>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
            {/* Модальне вікно скасування заявки */}
            <Dialog
                open={openCancelModal}
                onClose={() => {
                    setOpenCancelModal(false);
                    setCancelError(''); // Скидаємо помилку при закритті
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    Скасування заявки #{req?.id}
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                        Ви дійсно бажаєте скасувати цю заявку? Ця дія назавжди змінить статус у блокчейні, і відновити заявку буде неможливо.
                    </Typography>
                    <TextField
                        autoFocus
                        required
                        fullWidth
                        multiline
                        rows={3}
                        label="Причина скасування"
                        placeholder="Наприклад: Знайшов інше СТО, або змінилися плани..."
                        value={cancelReason}
                        onChange={(e) => {
                            setCancelReason(e.target.value);
                            if (e.target.value.trim()) setCancelError(''); // Прибираємо помилку, як тільки юзер почав друкувати
                        }}
                        error={!!cancelError} // Підсвічує червоним, якщо є помилка
                        helperText={cancelError} // Текст помилки під полем
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => {
                            setOpenCancelModal(false);
                            setCancelError('');
                        }}
                        size="large"
                    >
                        Назад
                    </Button>
                    <Button onClick={submitCancelRequest} variant="contained" color="error" size="large">
                        Підтвердити скасування
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Модалка результату перевірки цілісності */}
            <Dialog open={openIntegrityModal} onClose={() => setOpenIntegrityModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{
                    fontWeight: 'bold',
                    bgcolor: integrityResult?.valid ? 'success.main' : 'error.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    {integrityResult?.valid ? <VerifiedUserIcon /> : <GppBadIcon />}
                    Результат перевірки Blockchain
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: integrityResult?.valid ? 'success.main' : 'error.main', fontWeight: 'bold' }}>
                        {integrityResult?.message}
                    </Typography>

                    <Typography variant="subtitle2" color="text.secondary">Оригінальний хеш (з Блокчейну):</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', mb: 2, bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                        {integrityResult?.originalBlockchainHash || 'Не знайдено'}
                    </Typography>

                    <Typography variant="subtitle2" color="text.secondary">Поточний хеш (зчитано з файлу):</Typography>
                    <Typography variant="body2" sx={{
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                        bgcolor: integrityResult?.valid ? 'success.50' : 'error.50',
                        color: integrityResult?.valid ? 'success.dark' : 'error.dark',
                        p: 1,
                        borderRadius: 1
                    }}>
                        {integrityResult?.currentFileHash || 'Помилка читання'}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenIntegrityModal(false)} size="large">Закрити</Button>
                </DialogActions>
            </Dialog>
            {/* Модальне вікно Оплати */}
            <Dialog open={openPaymentModal} onClose={() => !isProcessingPayment && setOpenPaymentModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                    Безпечна онлайн-оплата
                </DialogTitle>
                <DialogContent dividers sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ mb: 1, textAlign: 'center' }}>
                        До сплати: <Box component="span" sx={{ color: 'success.main', fontWeight: 'bold', fontSize: '1.5rem' }}>{req?.depositAmount} UAH</Box>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
                        Внесіть завдаток, щоб СТО розпочало ремонт вашого автомобіля.
                    </Typography>

                    {/* Імітація форми картки (просто для візуалу, дані нікуди не йдуть) */}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <TextField fullWidth label="Номер картки" placeholder="0000 0000 0000 0000" disabled={isProcessingPayment} />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextField fullWidth label="Термін дії (ММ/РР)" placeholder="12/26" disabled={isProcessingPayment} />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextField fullWidth label="CVV" placeholder="***" type="password" disabled={isProcessingPayment} />
                        </Grid>
                    </Grid>

                    {isProcessingPayment && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
                            <CircularProgress size={40} sx={{ mb: 2 }} />
                            <Typography variant="body2" color="text.secondary">
                                Транзакція підписується в блокчейні... Це може зайняти кілька секунд.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
                    <Button
                        onClick={() => setOpenPaymentModal(false)}
                        size="large"
                        disabled={isProcessingPayment}
                    >
                        Скасувати
                    </Button>
                    <Button
                        onClick={handleOnlinePayment}
                        variant="contained"
                        color="success"
                        size="large"
                        disabled={isProcessingPayment}
                        sx={{ minWidth: 200 }}
                    >
                        {isProcessingPayment ? 'Обробка...' : 'Оплатити'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}