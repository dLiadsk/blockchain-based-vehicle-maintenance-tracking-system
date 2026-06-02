import React, { useState, useEffect, type JSX } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Grid, TextField, Autocomplete, Chip, Button
} from '@mui/material';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props for the InspectModal component.
 */
interface InspectModalProps {
    open: boolean;
    onClose: () => void;
    reqId: number | undefined;
    initialMileage: string;
    initialWorkTypes: string[];
    onAction: (endpoint: string, payload: any) => Promise<void>;
    actionLoading: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Modal component used by STO administrators to submit initial vehicle inspection results.
 * Captures mileage, found defects, required work types, total estimated amount, and required deposit.
 */
export default function InspectModal({
                                         open, onClose, reqId, initialMileage, initialWorkTypes, onAction, actionLoading
                                     }: InspectModalProps): JSX.Element {

    // Form state corresponding to the inspection payload
    const [form, setForm] = useState({
        mileage: '', findings: '', total: '', deposit: '', workTypes: [] as string[]
    });

    /**
     * Synchronizes local form state with initial props when the modal opens.
     */
    useEffect(() => {
        if (open) {
            setForm(prev => ({ ...prev, mileage: initialMileage, workTypes: initialWorkTypes }));
        }
    }, [open, initialMileage, initialWorkTypes]);

    /**
     * Submits the inspection data to the backend API.
     * Parses string values into required numeric formats before sending.
     */
    const handleSubmit = async () => {
        if (!reqId) return;

        await onAction(`/sto/inspection/${reqId}`, {
            currentMileage: parseInt(form.mileage, 10),
            findings: form.findings,
            workTypes: form.workTypes,
            totalAmount: parseFloat(form.total),
            depositAmount: parseFloat(form.deposit)
        });
    };

    // Pre-defined list of common service types for the Autocomplete suggestions
    const suggestedWorks = [
        'Комп\'ютерна діагностика', 'Діагностика ходової', 'Заміна мастила та фільтрів',
        'Заміна гальмівних колодок', 'Ремонт двигуна', 'Ремонт АКПП/МКПП', 'Шиномонтаж', 'Розвал-сходження'
    ];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold' }}>Результати технічного огляду</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth required type="number" label="Оновлений/Точний пробіг (км)"
                            value={form.mileage}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, mileage: e.target.value })}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth required multiline rows={3} label="Знайдені дефекти (Висновки)"
                            value={form.findings}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, findings: e.target.value })}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        {/* Workaround for MUI Autocomplete complex type conflicts when combining `multiple` and `freeSolo`.
                          The component is forcefully cast to `any` to prevent TS compilation errors.
                        */}
                        <Autocomplete
                            {...({
                                multiple: true,
                                freeSolo: true,
                                options: suggestedWorks,
                                value: form.workTypes,
                                onChange: (_event: React.SyntheticEvent, newValue: string[]) => {
                                    setForm({ ...form, workTypes: newValue || [] });
                                },
                                renderTags: (value: string[], getTagProps: (arg: { index: number }) => any) =>
                                    value.map((option: string, index: number) => {
                                        const { key, ...tagProps } = getTagProps({ index });
                                        return <Chip key={key} variant="outlined" color="primary" label={option} {...tagProps} />;
                                    }),
                                renderInput: (params: any) => (
                                    <TextField {...params} required label="Види робіт" placeholder="Оберіть зі списку або введіть та натисніть Enter" />
                                )
                            } as any)}
                        />
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                        <TextField
                            fullWidth required type="number" label="Загальна вартість (UAH)"
                            value={form.total}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, total: e.target.value })}
                        />
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                        <TextField
                            fullWidth required type="number" label="Необхідний завдаток (UAH)"
                            value={form.deposit}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, deposit: e.target.value })}
                        />
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose}>Скасувати</Button>
                <Button disabled={actionLoading} variant="contained" onClick={() => { void handleSubmit(); }}>
                    Зберегти акт та чекати оплати
                </Button>
            </DialogActions>
        </Dialog>
    );
}