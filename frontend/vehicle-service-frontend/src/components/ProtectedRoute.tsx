import type {JSX} from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export interface ProtectedRouteProps {
    /**
     * Array of roles that are permitted to access the nested routes.
     * Example: ['ROLE_ADMIN', 'ROLE_STO']
     */
    allowedRoles: string[];
}

/**
 * Mapping of user roles to their default fallback routes.
 * Used to redirect users if they attempt to access unauthorized areas.
 */
const ROLE_FALLBACK_ROUTES: Record<string, string> = {
    'ROLE_ADMIN': '/admin',
    'ROLE_STO': '/sto',
    'ROLE_USER': '/driver',
};

/**
 * Route guard component that restricts access based on user roles stored in localStorage.
 * If the user is unauthenticated or unauthorized, they are redirected to appropriate pages.
 *
 * @param {ProtectedRouteProps} props - Component properties.
 * @returns {JSX.Element} The nested routes (Outlet) if authorized, or a Navigate component for redirection.
 */
export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps): JSX.Element {
    const userRole = localStorage.getItem('userRole');

    // Scenario 1: User is not logged in (no role found)
    if (!userRole) {
        return <Navigate to="/login" replace />;
    }

    // Scenario 2: User is logged in but lacks the required role for this route
    if (!allowedRoles.includes(userRole)) {
        // Redirect to their specific dashboard if known, otherwise force re-login
        const fallbackRoute = ROLE_FALLBACK_ROUTES[userRole] || '/login';
        return <Navigate to={fallbackRoute} replace />;
    }

    // Scenario 3: User is authorized, proceed to render the child routes
    return <Outlet />;
}