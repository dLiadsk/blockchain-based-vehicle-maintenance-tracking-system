import { type JSX } from 'react';
import { Grid, Typography, Box, Divider, Paper } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import type { ServiceRequest } from '../../../types';
// ============================================================================
// TYPES
// ============================================================================

/**
 * Extended service request type specific to the STO dashboard.
 * Includes nested customer and mechanic details required for the view.
 */
interface StoExtendedRequest extends ServiceRequest {
    customer?: { firstName: string; lastName: string; email: string; phoneNumber?: string };
    mechanicName?: string;
    arrivalInstructions?: string;
}

interface StoRequestInfoProps {
    req: StoExtendedRequest;
}
// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Displays the core textual and financial information of a service request
 * for the STO management panel.
 */
export default function StoRequestInfo({ req }: StoRequestInfoProps): JSX.Element {
    return (
        <Grid container spacing={4}>

            {/* Customer Information */}
            <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">Клієнт</Typography>
                <Typography variant="h6">{req.customer?.firstName} {req.customer?.lastName}</Typography>
                <Typography variant="body2"><strong>Email:</strong> {req.customer?.email}</Typography>
                <Typography variant="body2"><strong>Телефон:</strong> {req.customer?.phoneNumber || 'Не вказано'}</Typography>
            </Grid>

            {/* Vehicle Details */}
            <Grid size={{ xs: 12, sm: 6 }}>
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

            {/* Client's Problem Description */}
            <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Опис проблеми від клієнта</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                    {req.description || 'Клієнт не залишив коментарів.'}
                </Typography>
            </Grid>

            {/* Current Instructions from STO */}
            {req.arrivalInstructions && (
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="primary.main" gutterBottom>Поточне повідомлення для клієнта (від СТО)</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', bgcolor: 'primary.50', p: 2, borderRadius: 1, borderLeft: '4px solid', borderColor: 'primary.main' }}>
                        {req.arrivalInstructions}
                    </Typography>
                </Grid>
            )}

            {/* Assigned Mechanic */}
            {req.mechanicName && (
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Відповідальний майстер</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                        <BuildIcon sx={{ fontSize: 18, verticalAlign: 'sub', mr: 1 }} />
                        {req.mechanicName}
                    </Typography>
                </Grid>
            )}

            {/* Financial Overview */}
            <Grid size={{ xs: 12, sm: 6 }}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.50', borderColor: 'success.light' }}>
                    <Typography variant="subtitle2" color="success.dark">Загальна вартість ремонту</Typography>
                    <Typography variant="h5" color="success.main" sx={{ fontWeight: 'bold' }}>{req.totalAmount || 0} UAH</Typography>
                </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'warning.50', borderColor: 'warning.light' }}>
                    <Typography variant="subtitle2" color="warning.dark">Сплачений / Очікуваний завдаток</Typography>
                    <Typography variant="h5" color="warning.main" sx={{ fontWeight: 'bold' }}>{req.depositAmount || 0} UAH</Typography>
                </Paper>
            </Grid>
        </Grid>
    );
}