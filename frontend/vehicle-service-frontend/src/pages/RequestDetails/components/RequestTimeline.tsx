import { type JSX } from 'react';
import { Box, Typography } from '@mui/material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';

import type { StatusHistory } from '../../../types';

interface RequestTimelineProps {
    history?: StatusHistory[];
}

/**
 * Component to display the vertical audit trail (status history) of a service request.
 */
export default function RequestTimeline({ history }: RequestTimelineProps): JSX.Element | null {
    if (!history || history.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary">
                Історія статусів відсутня.
            </Typography>
        );
    }

    return (
        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2 }}>
            <Timeline sx={{ [`& .${timelineItemClasses.root}:before`]: { flex: 0, padding: 0 } }}>
                {history.map((historyItem, index) => {
                    const isLast = index === history.length - 1;
                    return (
                        <TimelineItem key={index}>
                            <TimelineSeparator>
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
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            display: 'block',
                                            fontFamily: 'monospace',
                                            color: 'primary.main',
                                            wordBreak: 'break-all',
                                            mt: 0.5
                                        }}
                                    >
                                        Tx: {historyItem.blockchainTxHash}
                                    </Typography>
                                )}
                            </TimelineContent>
                        </TimelineItem>
                    );
                })}
            </Timeline>
        </Box>
    );
}