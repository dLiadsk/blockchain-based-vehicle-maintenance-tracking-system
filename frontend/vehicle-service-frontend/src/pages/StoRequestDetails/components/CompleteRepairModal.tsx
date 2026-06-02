import React, { useState, type JSX } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Grid, TextField, Typography, Box, IconButton, Button, Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Represents a single service or replacement part in the final repair bill.
 */
export interface WorkItem {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

/**
 * Props for the CompleteRepairModal component.
 */
interface CompleteRepairModalProps {
    open: boolean;
    onClose: () => void;
    reqId: number | undefined;
    onAction: (endpoint: string, payload: any) => Promise<void>;
    actionLoading: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Modal component allowing STO administrators to finalize a service request.
 * Generates the final repair bill including mechanic details, a message to the client,
 * and an itemized list of works and parts.
 */
export default function CompleteRepairModal({
                                                open, onClose, reqId, onAction, actionLoading
                                            }: CompleteRepairModalProps): JSX.Element {

    // Component state for form fields
    const [mechanic, setMechanic] = useState<string>('');
    const [message, setMessage] = useState<string>('Ваше авто готове! Можете забирати сьогодні до 18:00.');
    const [workItems, setWorkItems] = useState<WorkItem[]>([
        { description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }
    ]);

    /**
     * Calculates the total amount for all items in the workItems array.
     */
    const calculateFinalTotal = (): number => {
        return workItems.reduce((acc, item) => acc + item.totalPrice, 0);
    };

    /**
     * Handles changes to individual fields within a specific work item row.
     * Automatically recalculates the total price for the row if quantity or unit price changes.
     */
    const handleWorkItemChange = (index: number, field: keyof WorkItem, value: string) => {
        const newItems = [...workItems];

        if (field === 'description') {
            newItems[index].description = value;
        } else {
            const numValue = parseFloat(value) || 0;
            // Safely assign the parsed number to numeric fields
            newItems[index][field] = numValue as never;
            // Recalculate row total
            newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
        }

        setWorkItems(newItems);
    };

    /**
     * Appends a new empty work item row to the form.
     */
    const addWorkItemRow = () => {
        setWorkItems([...workItems, { description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
    };

    /**
     * Removes a specific work item row by its index.
     */
    const removeWorkItemRow = (index: number) => {
        setWorkItems(workItems.filter((_, i) => i !== index));
    };

    /**
     * Submits the finalized repair data to the backend API.
     */
    const handleSubmit = async () => {
        if (!reqId) return;

        await onAction(`/sto/complete-repair/${reqId}`, {
            items: workItems,
            finalTotalAmount: calculateFinalTotal(),
            mechanicName: mechanic,
            message: message
        });
    };

    // Validation: Ensure mechanic name is provided and all work items have descriptions
    const isFormIncomplete = !mechanic || workItems.some(i => !i.description);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold' }}>Фінальний звіт про ремонт</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth required label="Відповідальний майстер (ПІБ)"
                            placeholder="Наприклад: Іванов Іван"
                            value={mechanic}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMechanic(e.target.value)}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth multiline rows={2}
                            label="Повідомлення для клієнта (Коли забирати авто)"
                            value={message}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Виконані роботи та замінені запчастини
                        </Typography>

                        {workItems.map((item, index) => (
                            <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                                <TextField
                                    sx={{ flexGrow: 1 }} label="Опис (робота або деталь)" size="small" required
                                    value={item.description}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleWorkItemChange(index, 'description', e.target.value)}
                                />
                                <TextField
                                    sx={{ width: '100px' }} label="К-ть" type="number" size="small"
                                    value={item.quantity}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleWorkItemChange(index, 'quantity', e.target.value)}
                                />
                                <TextField
                                    sx={{ width: '150px' }} label="Ціна за од. (UAH)" type="number" size="small"
                                    value={item.unitPrice}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleWorkItemChange(index, 'unitPrice', e.target.value)}
                                />
                                <TextField
                                    sx={{ width: '150px' }} label="Сума (UAH)" size="small" disabled
                                    value={item.totalPrice}
                                />
                                <IconButton color="error" onClick={() => removeWorkItemRow(index)} disabled={workItems.length === 1}>
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                        ))}
                        <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={addWorkItemRow}>Додати рядок</Button>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Paper sx={{ p: 2, bgcolor: 'primary.50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" color="primary.main">Всього до сплати:</Typography>
                            <Typography variant="h5" color="primary.dark" sx={{ fontWeight: 'bold' }}>{calculateFinalTotal()} UAH</Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose}>Скасувати</Button>
                <Button disabled={actionLoading || isFormIncomplete} variant="contained" color="info" onClick={() => { void handleSubmit(); }}>
                    Згенерувати акт виконаних робіт
                </Button>
            </DialogActions>
        </Dialog>
    );
}