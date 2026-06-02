import { useState } from 'react';
import { Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import api from '../services/api';

export interface BlockchainSyncButtonProps {
    /** * Optional callback function triggered after a successful blockchain synchronization.
     * Useful for refreshing parent component data (e.g., fetching updated requests).
     */
    onSuccess?: () => void;
}

/**
 * Component that triggers a blockchain state synchronization.
 * Restores deleted or out-of-sync database records using the blockchain as the source of truth.
 */
export default function BlockchainSyncButton({ onSuccess }: BlockchainSyncButtonProps) {
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const handleSyncDeleted = async (): Promise<void> => {
        setIsSyncing(true);
        try {
            const response = await api.post('/audit/sync-deleted');

            // Show successful synchronization message from the backend
            setNotification({ message: response.data || 'Синхронізацію успішно завершено', type: 'success' });

            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            console.error('Blockchain synchronization failed:', error);

            // Extract error message from backend response or fallback to generic message
            const errorMessage = error.response?.data || 'Помилка синхронізації з блокчейном';
            setNotification({ message: errorMessage, type: 'error' });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleCloseNotification = () => setNotification(null);

    return (
        <>
            <Button
                variant="contained"
                color="secondary"
                startIcon={isSyncing ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
                onClick={handleSyncDeleted}
                disabled={isSyncing}
                sx={{ fontWeight: 'bold', boxShadow: 2 }}
            >
                {isSyncing ? 'Синхронізація...' : 'Відновити базу з Блокчейну'}
            </Button>

            {/* Replaced native alert() with a professional Material-UI Snackbar */}
            <Snackbar
                open={!!notification}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification?.type || 'info'}
                    sx={{ width: '100%' }}
                    elevation={6}
                    variant="filled"
                >
                    {notification?.message}
                </Alert>
            </Snackbar>
        </>
    );
}