import { type JSX } from 'react';
import { Box, Typography, Grid, Divider, Chip } from '@mui/material';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import PhoneIcon from '@mui/icons-material/Phone';
import BuildIcon from '@mui/icons-material/Build';

import type { ServiceRequest, StoProfile } from '../../../types';

interface ExtendedServiceRequest extends ServiceRequest {
    manager?: { firstName: string; lastName: string; phoneNumber?: string };
    mechanic?: string;
    arrivalInstructions?: string;
    sto?: StoProfile;
}

interface RequestInfoProps {
    req: ExtendedServiceRequest;
    showManagerContact: boolean;
    shouldShowComment: boolean;
}

/**
 * Displays the core information of the service request including vehicle details, assigned STO, cost, and personnel.
 */
export default function RequestInfo({ req, showManagerContact, shouldShowComment }: RequestInfoProps): JSX.Element {
    return (
        <Grid container spacing={4}>
            {/* Vehicle & STO Info */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Автомобіль</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {req.vehicle?.brand} {req.vehicle?.model}
                </Typography>

                <Typography variant="body2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <strong>Зафіксований пробіг:</strong> {req.vehicle?.mileage ? `${req.vehicle.mileage} км` : 'Не вказано'}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Обране СТО</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{req.sto?.stationName}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {req.sto?.city}, {req.sto?.address}
                </Typography>

                {/* Manager Contacts */}
                {showManagerContact && req.manager && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 2, borderLeft: '4px solid', borderColor: 'info.main' }}>
                        <Typography variant="subtitle2" color="info.main" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Зв'язок з менеджером:
                        </Typography>

                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <SupportAgentIcon fontSize="small" color="info" />
                            <strong>{req.manager.firstName} {req.manager.lastName}</strong>
                        </Typography>

                        {req.manager.phoneNumber && (
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PhoneIcon fontSize="small" color="info" />
                                <a href={`tel:${req.manager.phoneNumber}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}>
                                    {req.manager.phoneNumber}
                                </a>
                            </Typography>
                        )}
                    </Box>
                )}
            </Grid>

            {/* Cost & Blockchain Info */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Орієнтовна / Загальна вартість</Typography>
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

            {/* STO Comments */}
            {shouldShowComment && (
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="primary.main" gutterBottom>Повідомлення від СТО:</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', bgcolor: 'primary.50', p: 2, borderRadius: 1, borderLeft: '4px solid', borderColor: 'primary.main' }}>
                        {req.arrivalInstructions}
                    </Typography>
                </Grid>
            )}

            {/* Mechanic Info */}
            {req.mechanic && (
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Відповідальний майстер</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                        <BuildIcon sx={{ fontSize: 18, verticalAlign: 'sub', mr: 1 }} />
                        {req.mechanic}
                    </Typography>
                </Grid>
            )}

            {/* Problem Description */}
            <Grid size={{ xs: 12 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Опис проблеми:</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{req.description || 'Водій не залишив коментарів.'}</Typography>
            </Grid>

            {/* Confirmed Works */}
            {req.workTypes && req.workTypes.length > 0 && (
                <Grid size={{ xs: 12 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Підтверджені роботи:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {req.workTypes.map((work: string, i: number) => (
                            <Chip key={i} label={work} variant="outlined" color="primary" />
                        ))}
                    </Box>
                </Grid>
            )}
        </Grid>
    );
}