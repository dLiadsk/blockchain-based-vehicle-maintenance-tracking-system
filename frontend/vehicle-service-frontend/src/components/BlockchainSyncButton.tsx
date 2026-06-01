import { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import api from '../services/api';

interface BlockchainSyncButtonProps {
    onSuccess?: () => void; // Функція зворотного виклику, щоб оновити список заявок після відновлення
}

export default function BlockchainSyncButton({ onSuccess }: BlockchainSyncButtonProps) {
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSyncDeleted = async () => {
        setIsSyncing(true);
        try {
            const response = await api.post(`/audit/sync-deleted`);
            alert(response.data); // Виводимо результат

            // Якщо передали функцію onSuccess (наприклад, fetchRequests), викликаємо її
            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            alert(error.response?.data || 'Помилка синхронізації з блокчейном');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <Button
            variant="contained"
            color="secondary" // Можна обрати 'info' або 'secondary', щоб вона виділялася
            startIcon={isSyncing ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
            onClick={handleSyncDeleted}
            disabled={isSyncing}
            sx={{ fontWeight: 'bold', boxShadow: 2 }} // Робимо її трохи масивнішою
        >
            {isSyncing ? 'Синхронізація...' : 'Відновити базу з Блокчейну'}
        </Button>
    );
}