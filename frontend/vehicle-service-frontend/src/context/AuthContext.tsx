import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

export interface JwtPayload {
    /** Subject of the token, typically the user's email or username */
    sub: string;
    /** User's assigned role (e.g., ROLE_USER, ROLE_ADMIN, ROLE_STO) */
    role?: string;
    /** Expiration timestamp in seconds */
    exp: number;
}

export interface AuthUser {
    email: string;
    role?: string;
}

export interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

/**
 * Global Authentication Provider.
 * Manages JWT verification, user session state, and localStorage synchronization.
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<AuthUser | null>(null);

    // Wrapped in useCallback to maintain referential equality
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        setToken(null);
        setUser(null);
    }, []);

    const login = useCallback((newToken: string) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
    }, []);

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode<JwtPayload>(token);
                const currentTime = Date.now() / 1000;

                // Validate token expiration
                if (decoded.exp < currentTime) {
                    console.warn('Authentication token expired. Logging out.');
                    logout();
                } else {
                    setUser({ email: decoded.sub, role: decoded.role });

                    // Centralize userRole synchronization if it exists in the token payload
                    if (decoded.role) {
                        localStorage.setItem('userRole', decoded.role);
                    }
                }
            } catch (error) {
                console.error('Invalid or corrupted JWT token:', error);
                logout();
            }
        } else {
            setUser(null);
        }
    }, [token, logout]);

    // Memoized context value prevents unnecessary re-renders of consumer components
    const contextValue = useMemo<AuthContextType>(() => ({
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout
    }), [user, token, login, logout]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Custom hook to consume the AuthContext safely.
 * * @throws {Error} If used outside of an AuthProvider.
 * @returns {AuthContextType} The current authentication state and methods.
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};