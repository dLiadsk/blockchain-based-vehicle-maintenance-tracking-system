import { Box, Typography, Container, Grid, Divider } from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SecurityIcon from '@mui/icons-material/Security';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <Box
            component="footer"
            sx={{
                bgcolor: 'grey.900',
                color: 'grey.300',
                py: 6,
                mt: 'auto', // Відштовхує футер до самого низу сторінки
                borderTop: '4px solid',
                borderColor: 'primary.main'
            }}
        >
            <Container maxWidth="lg">
                <Grid container spacing={4} sx={{ justifyContent: 'space-between' }}>

                    {/* Блок 1: Про систему */}
                    <Grid size={{xs: 12, md: 5}}>
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DirectionsCarIcon color="primary" />
                            Blockchain-based Vehicle Maintenance Tracking System
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
                            Децентралізована система відстеження технічного обслуговування автомобілів на базі смарт-контрактів Ethereum. Забезпечує 100% прозорість, незмінність історії та захист від шахрайства.
                        </Typography>
                    </Grid>


                    {/* Блок 3: Переваги / Технології */}
                    <Grid size={{xs: 12, sm: 6, md: 4 }}>
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                            Технології
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SecurityIcon fontSize="small" color="secondary" /> Web3 & Solidity
                            </Typography>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AutoFixHighIcon fontSize="small" color="primary" /> Spring Boot & Java
                            </Typography>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <DirectionsCarIcon fontSize="small" color="info" /> React & Material-UI
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4, borderColor: 'grey.800' }} />

                {/* Нижній рядок з копірайтом та авторством */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="grey.500">
                        © {currentYear} Blockchain Vehicle Tracking.
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}