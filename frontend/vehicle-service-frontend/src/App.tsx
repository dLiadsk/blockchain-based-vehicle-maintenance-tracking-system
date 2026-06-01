import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login.tsx';
import Layout from "./components/Layout.tsx";
import AdminDashboard from './pages/AdminDashboard';
import Register from './pages/Register';
import DriverDashboard from './pages/DriverDashboard';
import VehicleDetails from './pages/VehicleDetails';
import StoCatalog from './pages/StoCatalog';
import StoDetails from './pages/StoDetails';
import MyRequests from './pages/MyRequests';
import RequestDetails from './pages/RequestDetails';
import StoDashboard from './pages/StoDashboard';
import StoRequestDetails from './pages/StoRequestDetails';
import Footer from './components/Footer';

function App() {
    return (
        <BrowserRouter>
            {/* Головний контейнер на весь екран, використовує Flexbox */}
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>

                {/* Блок з контентом. flexGrow: 1 змушує його зайняти весь вільний простір, відштовхуючи футер вниз */}
                <Box sx={{ flexGrow: 1 }}>
                    <Routes>
                        {/* Публічні маршрути */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Захищені маршрути всередині єдиного Layout */}
                        <Route element={<Layout />}>

                            {/* Тільки для Водіїв */}
                            <Route element={<ProtectedRoute allowedRoles={['ROLE_USER']} />}>
                                <Route path="/driver/*" element={<DriverDashboard />} />
                                <Route path="/sto-catalog" element={<StoCatalog />} />
                                <Route path="/sto-catalog/:id" element={<StoDetails />} />
                                <Route path="/my-requests" element={<MyRequests />} />
                                <Route path="/requests/:id" element={<RequestDetails />} />
                            </Route>

                            {/* Тільки для СТО */}
                            <Route element={<ProtectedRoute allowedRoles={['ROLE_STO']} />}>
                                <Route path="/sto/*" element={<StoDashboard />} />
                                <Route path="/sto/requests/:id" element={<StoRequestDetails />} />
                            </Route>

                            {/* Тільки для Адмінів */}
                            <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']} />}>
                                <Route path="/admin/*" element={<AdminDashboard />} />
                            </Route>

                            {/* Спільний доступ (авто можуть бачити всі три ролі) */}
                            <Route element={<ProtectedRoute allowedRoles={['ROLE_USER', 'ROLE_STO', 'ROLE_ADMIN']} />}>
                                <Route path="/vehicle/:vin" element={<VehicleDetails />} />
                            </Route>

                        </Route>

                        {/* Редирект за замовчуванням */}
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </Box>

                {/* Футер, який завжди буде внизу */}
                <Footer />

            </Box>
        </BrowserRouter>
    );
}

export default App;