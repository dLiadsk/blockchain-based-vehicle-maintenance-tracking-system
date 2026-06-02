import React, { useState, type JSX } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, TextField, Button, Box, CircularProgress, Grid } from '@mui/material';
import api from '../../../services/api';

interface PaymentModalProps {
    open: boolean;
    onClose: () => void;
    reqId: number | undefined;
    depositAmount: number | undefined;
    onSuccess: (receiptPdfHash: string, txHash: string) => void;
}

export default function PaymentModal({ open, onClose, reqId, depositAmount, onSuccess }: PaymentModalProps): JSX.Element {
    const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
    const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '' });
    const [error, setError] = useState<string>('');

    const handleOnlinePayment = async () => {
        if (!reqId) return;

        if (!cardData.number || !cardData.expiry || !cardData.cvv) {
            setError('Будь ласка, заповніть всі дані картки');
            return;
        }

        setError('');
        setIsProcessingPayment(true);

        try {
            const response = await api.post<{ receiptPdfHash: string; txHash: string }>(`/service-requests/${reqId}/pay-online`);

            // Скидаємо стейт форми
            setCardData({ number: '', expiry: '', cvv: '' });
            onSuccess(response.data.receiptPdfHash, response.data.txHash);
        } catch (err) {
            console.error("Помилка оплати:", err);
            setError('Не вдалося провести оплату. Перевірте дані або спробуйте пізніше.');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const handleClose = () => {
        if (!isProcessingPayment) {
            setError('');
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                Безпечна онлайн-оплата
            </DialogTitle>
            <DialogContent dividers sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ mb: 1, textAlign: 'center' }}>
                    До сплати: <Box component="span" sx={{ color: 'success.main', fontWeight: 'bold', fontSize: '1.5rem' }}>{depositAmount} UAH</Box>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
                    Внесіть завдаток, щоб СТО розпочало ремонт вашого автомобіля.
                </Typography>

                {error && <Typography color="error" variant="body2" sx={{ mb: 2, textAlign: 'center' }}>{error}</Typography>}

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            label="Номер картки"
                            placeholder="0000 0000 0000 0000"
                            disabled={isProcessingPayment}
                            value={cardData.number}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardData({...cardData, number: e.target.value})}
                        />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <TextField
                            fullWidth
                            label="Термін дії (ММ/РР)"
                            placeholder="12/26"
                            disabled={isProcessingPayment}
                            value={cardData.expiry}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardData({...cardData, expiry: e.target.value})}
                        />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <TextField
                            fullWidth
                            label="CVV"
                            placeholder="***"
                            type="password"
                            disabled={isProcessingPayment}
                            value={cardData.cvv}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardData({...cardData, cvv: e.target.value})}
                        />
                    </Grid>
                </Grid>
                {isProcessingPayment && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
                        <CircularProgress size={40} sx={{ mb: 2 }} />
                        <Typography variant="body2" color="text.secondary" align="center">
                            Транзакція підписується в блокчейні...<br/>Це може зайняти кілька секунд.
                        </Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
                <Button onClick={handleClose} size="large" disabled={isProcessingPayment}>Скасувати</Button>
                <Button onClick={() => { void handleOnlinePayment(); }} variant="contained" color="success" size="large" disabled={isProcessingPayment} sx={{ minWidth: 200 }}>
                    {isProcessingPayment ? 'Обробка...' : 'Оплатити'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}