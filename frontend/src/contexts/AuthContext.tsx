'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

interface User {
    id: number;
    username: string;
    display_name: string;
    email?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string) => Promise<void>;
    register: (username: string, displayName: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check if user is authenticated on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                // Token invalid, clear it
                localStorage.removeItem('auth_token');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('auth_token');
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (username: string, displayName: string) => {
        try {
            // Step 1: Begin registration
            const beginResponse = await fetch(`${API_URL}/api/auth/register/begin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, display_name: displayName }),
            });

            if (!beginResponse.ok) {
                const error = await beginResponse.json();
                throw new Error(error.detail || 'Registration failed');
            }

            const options = await beginResponse.json();

            // Step 2: Create passkey with browser (v10.0.0 takes options directly)
            const credential = await startRegistration(options);

            // Step 3: Complete registration
            const completeResponse = await fetch(`${API_URL}/api/auth/register/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    display_name: displayName,
                    credential,
                }),
            });

            if (!completeResponse.ok) {
                const error = await completeResponse.json();
                throw new Error(error.detail || 'Registration completion failed');
            }

            const { access_token, user: userData } = await completeResponse.json();

            // Store token and user
            localStorage.setItem('auth_token', access_token);
            setUser(userData);
        } catch (error: any) {
            console.error('Registration error:', error);
            if (error.name === 'NotAllowedError') {
                throw new Error('Passkey creation was cancelled or not allowed');
            }
            throw error;
        }
    };

    const login = async (username: string) => {
        try {
            // Step 1: Begin login
            const beginResponse = await fetch(`${API_URL}/api/auth/login/begin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });

            if (!beginResponse.ok) {
                const error = await beginResponse.json();
                throw new Error(error.detail || 'Login failed');
            }

            const options = await beginResponse.json();

            // Step 2: Authenticate with passkey (v10.0.0 takes options directly)
            const credential = await startAuthentication(options);

            // Step 3: Complete login
            const completeResponse = await fetch(`${API_URL}/api/auth/login/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    credential,
                }),
            });

            if (!completeResponse.ok) {
                const error = await completeResponse.json();
                throw new Error(error.detail || 'Login completion failed');
            }

            const { access_token, user: userData } = await completeResponse.json();

            // Store token and user
            localStorage.setItem('auth_token', access_token);
            setUser(userData);
        } catch (error: any) {
            console.error('Login error:', error);
            if (error.name === 'NotAllowedError') {
                throw new Error('Authentication was cancelled or not allowed');
            }
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
