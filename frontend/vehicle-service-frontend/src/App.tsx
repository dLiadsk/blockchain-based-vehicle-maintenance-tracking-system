import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login.tsx';
import Layout from "./components/Layout.tsx";
import AdminDashboard from './pages/AdminDashboard';

// Тимчасові заглушки для інших сторінок
const RegisterPage = () => <Typography variant="h4" sx={{ p: 3 }}>Сторінка реєстрації</Typography>;
const DriverDashboard = () => <Typography variant="h4" sx={{ p: 3 }}>Дашборд Водія (Мої авто та заявки)</Typography>;
const StoDashboard = () => <Typography variant="h4" sx={{ p: 3 }}>Дашборд СТО (Заявки на ремонт)</Typography>;

function App() {
    return (
        <BrowserRouter>
            <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
                <Routes>
                    {/* Публічні маршрути */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Захищені маршрути */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<Layout />}>
                            <Route path="/driver/*" element={<DriverDashboard />} />
                            <Route path="/sto/*" element={<StoDashboard />} />
                            <Route path="/admin/*" element={<AdminDashboard />} />
                        </Route>
                    </Route>

                    {/* Редирект за замовчуванням */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Box>
        </BrowserRouter>
    );
}

export default App;