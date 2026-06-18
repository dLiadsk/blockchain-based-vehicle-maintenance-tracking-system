import { type JSX } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard/DriverDashboard';
import VehicleDetails from './pages/VehicleDetails';
import StoCatalog from './pages/StoCatalog';
import StoDetails from './pages/StoDetails';
import MyRequests from './pages/MyRequests';
import RequestDetails from './pages/RequestDetails/RequestDetails';
import StoDashboard from './pages/StoDashboard';
import StoRequestDetails from './pages/StoRequestDetails/StoRequestDetails';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * The root application component.
 * Configures the routing logic, role-based access control (RBAC),
 * and the overall page layout structure including the global footer.
 */
export default function App(): JSX.Element {
    return (
        <BrowserRouter>
            {/* Main container taking up full viewport height */}
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>

                {/* Content area that grows to push the footer to the bottom */}
                <Box sx={{ flexGrow: 1 }}>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Protected Routes wrapped inside the main Layout */}
                        <Route element={<Layout />}>

                            {/* Driver-only Routes */}
                            <Route element={<ProtectedRoute allowedRoles={['ROLE_USER']} />}>
                                <Route path="/driver/*" element={<DriverDashboard />} />
                                <Route path="/sto-catalog" element={<StoCatalog />} />
                                <Route path="/sto-catalog/:id" element={<StoDetails />} />
                                <Route path="/my-requests" element={<MyRequests />} />
                                <Route path="/requests/:id" element={<RequestDetails />} />
                            </Route>

                            {/* STO (Service Station) only Routes */}
                            <Route element={<ProtectedRoute allowedRoles={['ROLE_STO']} />}>
                                <Route path="/sto/*" element={<StoDashboard />} />
                                <Route path="/sto/requests/:id" element={<StoRequestDetails />} />
                            </Route>

                            {/* Admin-only Routes */}
                            <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']} />}>
                                <Route path="/admin/*" element={<AdminDashboard />} />
                            </Route>

                            {/* Shared Routes (Accessible by all authenticated roles) */}
                            <Route element={<ProtectedRoute allowedRoles={['ROLE_USER', 'ROLE_STO', 'ROLE_ADMIN']} />}>
                                <Route path="/vehicle/:vin" element={<VehicleDetails />} />
                            </Route>

                        </Route>

                        {/* Fallback Route: Redirects unmapped URLs to the Login page */}
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </Box>

                {/* Global Footer component pinned to the bottom */}
                <Footer />

            </Box>
        </BrowserRouter>
    );
}