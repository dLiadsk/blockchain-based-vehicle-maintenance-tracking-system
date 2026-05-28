import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth();

    // Якщо користувач не авторизований, перенаправляємо на сторінку входу
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Якщо все ок, рендеримо дочірні маршрути (наші дашборди)
    return <Outlet />;
};