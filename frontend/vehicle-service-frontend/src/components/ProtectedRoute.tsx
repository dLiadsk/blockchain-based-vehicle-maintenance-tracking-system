import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
    allowedRoles: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const userRole = localStorage.getItem('userRole');

    if (!userRole) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(userRole)) {
        // Якщо роль не підходить, відправляємо на відповідний головний екран
        if (userRole === 'ROLE_ADMIN') return <Navigate to="/admin" replace />;
        if (userRole === 'ROLE_STO') return <Navigate to="/sto" replace />;
        if (userRole === 'ROLE_USER') return <Navigate to="/driver" replace />;

        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}