import type {JSX} from 'react';
import { Box, Typography, Container, Grid, Divider } from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SecurityIcon from '@mui/icons-material/Security';

// Extracting static data outside the component prevents unnecessary re-creations on every render
const TECH_STACK = [
    { name: 'Web3 & Solidity', icon: <SecurityIcon fontSize="small" color="secondary" /> },
    { name: 'Spring Boot & Java', icon: <AutoFixHighIcon fontSize="small" color="primary" /> },
    { name: 'React & Material-UI', icon: <DirectionsCarIcon fontSize="small" color="info" /> },
] as const;

/**
 * Global application footer component.
 * Displays system information, technology stack, and copyright details.
 * Designed to be pushed to the bottom of the viewport using flexbox in the parent layout.
 *
 * @returns {JSX.Element} The rendered Footer component.
 */
export default function Footer(): JSX.Element {
    const currentYear = new Date().getFullYear();

    return (
        <Box
            component="footer"
            sx={{
                bgcolor: 'grey.900',
                color: 'grey.300',
                py: 6,
                mt: 'auto',
                borderTop: '4px solid',
                borderColor: 'primary.main'
            }}
        >
            <Container maxWidth="lg">
                <Grid container spacing={4} sx={{ justifyContent: 'space-between' }}>

                    {/* System Overview Section */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Typography
                            variant="h6"
                            sx={{ color: 'white', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                            <DirectionsCarIcon color="primary" />
                            Blockchain-based Vehicle Maintenance Tracking System
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
                            Децентралізована система відстеження технічного обслуговування автомобілів на базі смарт-контрактів Ethereum. Забезпечує 100% прозорість, незмінність історії та захист від шахрайства.
                        </Typography>
                    </Grid>

                    {/* Technology Stack Section */}
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                            Технології
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {TECH_STACK.map((tech, index) => (
                                <Typography key={index} variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {tech.icon} {tech.name}
                                </Typography>
                            ))}
                        </Box>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4, borderColor: 'grey.800' }} />

                {/* Copyright & Developer Credits Section */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="grey.500">
                        © {currentYear} Blockchain Vehicle Tracking.
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}