import { type JSX } from 'react';
import { Box, Typography, Button } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SecurityIcon from '@mui/icons-material/Security';
import type { ServiceRequest } from '../../../types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Extended service request type for document rendering.
 * Includes the final receipt PDF hash which might not be present in the base type.
 */
interface StoExtendedRequest extends ServiceRequest {
    finalReceiptPdfHash?: string;
}

/**
 * Props for the StoRequestDocuments component.
 */
interface StoRequestDocumentsProps {
    req: StoExtendedRequest;
    verifyingDoc: string;
    onViewPdf: (docType: string) => void;
    onVerify: (docType: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Renders the available PDF documents for a service request.
 * Provides actions to view the document and verify its integrity against the blockchain.
 */
export default function StoRequestDocuments({
                                                req,
                                                verifyingDoc,
                                                onViewPdf,
                                                onVerify
                                            }: StoRequestDocumentsProps): JSX.Element {
    return (
        <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Документи та Аудит:</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>

                {/* Official Service Request */}
                {req.pdfHash && (
                    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Офіційна заявка на СТО</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', mb: 2, wordBreak: 'break-all' }}>SHA-256: {req.pdfHash}</Typography>
                        <Button variant="outlined" color="primary" startIcon={<PictureAsPdfIcon />} sx={{ mt: 'auto', mb: 1 }} onClick={() => onViewPdf('service_request')}>Переглянути PDF</Button>
                        <Button variant="contained" color="secondary" startIcon={<SecurityIcon />} onClick={() => onVerify('service_request')} disabled={verifyingDoc === 'service_request'}>
                            {verifyingDoc === 'service_request' ? 'Перевірка...' : 'Перевірити цілісність'}
                        </Button>
                    </Box>
                )}

                {/* Inspection Report */}
                {req.inspectionPdfHash && (
                    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Акт технічного огляду</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', mb: 2, wordBreak: 'break-all' }}>SHA-256: {req.inspectionPdfHash}</Typography>
                        <Button variant="outlined" color="info" startIcon={<PictureAsPdfIcon />} sx={{ mt: 'auto', mb: 1 }} onClick={() => onViewPdf('inspection_report')}>Переглянути PDF</Button>
                        <Button variant="contained" color="secondary" startIcon={<SecurityIcon />} onClick={() => onVerify('inspection_report')} disabled={verifyingDoc === 'inspection_report'}>
                            {verifyingDoc === 'inspection_report' ? 'Перевірка...' : 'Перевірити цілісність'}
                        </Button>
                    </Box>
                )}

                {/* Deposit Receipt */}
                {req.paymentReceiptPdfHash && (
                    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Квитанція (Завдаток)</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', mb: 2, wordBreak: 'break-all' }}>SHA-256: {req.paymentReceiptPdfHash}</Typography>
                        <Button variant="outlined" color="warning" startIcon={<PictureAsPdfIcon />} sx={{ mt: 'auto', mb: 1 }} onClick={() => onViewPdf('deposit_receipt')}>Переглянути PDF</Button>
                        <Button variant="contained" color="secondary" startIcon={<SecurityIcon />} onClick={() => onVerify('deposit_receipt')} disabled={verifyingDoc === 'deposit_receipt'}>
                            {verifyingDoc === 'deposit_receipt' ? 'Перевірка...' : 'Перевірити цілісність'}
                        </Button>
                    </Box>
                )}

                {/* Work Report */}
                {req.workReportPdfHash && (
                    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Акт виконаних робіт</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', mb: 2, wordBreak: 'break-all' }}>SHA-256: {req.workReportPdfHash}</Typography>
                        <Button variant="contained" color="info" startIcon={<PictureAsPdfIcon />} sx={{ mt: 'auto', mb: 1 }} onClick={() => onViewPdf('work_report')}>Переглянути PDF</Button>
                        <Button variant="contained" color="secondary" startIcon={<SecurityIcon />} onClick={() => onVerify('work_report')} disabled={verifyingDoc === 'work_report'}>
                            {verifyingDoc === 'work_report' ? 'Перевірка...' : 'Перевірити цілісність'}
                        </Button>
                    </Box>
                )}

                {/* Final Settlement Receipt */}
                {req.finalReceiptPdfHash && (
                    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Фінальний чек розрахунку</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', mb: 2, wordBreak: 'break-all' }}>SHA-256: {req.finalReceiptPdfHash}</Typography>
                        <Button variant="contained" color="success" startIcon={<PictureAsPdfIcon />} sx={{ mt: 'auto', mb: 1 }} onClick={() => onViewPdf('final_settlement')}>Переглянути PDF</Button>
                        <Button variant="contained" color="secondary" startIcon={<SecurityIcon />} onClick={() => onVerify('final_settlement')} disabled={verifyingDoc === 'final_settlement'}>
                            {verifyingDoc === 'final_settlement' ? 'Перевірка...' : 'Перевірити цілісність'}
                        </Button>
                    </Box>
                )}
            </Box>
        </Box>
    );
}