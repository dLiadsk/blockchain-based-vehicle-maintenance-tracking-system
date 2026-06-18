import React, { useState, type JSX } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, TextField, Button } from '@mui/material';
import api from '../../../services/api';

interface CancelRequestModalProps {
    open: boolean;
    onClose: () => void;
    reqId: number | undefined;
    onSuccess: () => void;
}

export default function CancelRequestModal({ open, onClose, reqId, onSuccess }: CancelRequestModalProps): JSX.Element {
    const [cancelReason, setCancelReason] = useState<string>('');
    const [cancelError, setCancelError] = useState<string>('');

    const submitCancelRequest = async () => {
        if (!reqId) return;

        if (!cancelReason.trim()) {
            setCancelError('Будь ласка, вкажіть причину скасування.');
            return;
        }

        setCancelError('');

        try {
            await api.put(`/service-requests/${reqId}/cancel`, { reason: cancelReason });
            setCancelReason('');
            onSuccess();
        } catch (err) {
            console.error("Помилка скасування заявки:", err);
            setCancelError('Не вдалося скасувати заявку. Перевірте консоль для деталей.');
        }
    };

    const handleClose = () => {
        setCancelReason('');
        setCancelError('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>
                Скасування заявки #{reqId}
            </DialogTitle>
            <DialogContent dividers>
                <Typography variant="body1" sx={{ mb: 3 }}>
                    Ви дійсно бажаєте скасувати цю заявку? Ця дія назавжди змінить статус у блокчейні.
                </Typography>
                <TextField
                    autoFocus
                    required
                    fullWidth
                    multiline
                    rows={3}
                    label="Причина скасування"
                    placeholder="Наприклад: Змінилися плани..."
                    value={cancelReason}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setCancelReason(e.target.value);
                        if (e.target.value.trim()) setCancelError('');
                    }}
                    error={!!cancelError}
                    helperText={cancelError}
                />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={handleClose} size="large">Назад</Button>
                <Button onClick={() => { void submitCancelRequest(); }} variant="contained" color="error" size="large">
                    Підтвердити скасування
                </Button>
            </DialogActions>
        </Dialog>
    );
}