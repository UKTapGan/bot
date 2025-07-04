import type { User } from '../types';
import { UserRole } from '../types';

// Ми будемо використовувати відносний шлях, оскільки налаштуємо проксі у Vite
const API_URL = '/api'; 

// Зберігаємо поточного користувача в sessionStorage для швидкого доступу протягом сесії
const CURRENT_USER_SESSION_KEY = 'uvape_assistant_currentUser';

// Універсальні функції для роботи з API
const api = {
    async get(endpoint: string) {
        const response = await fetch(`${API_URL}${endpoint}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Помилка запиту: ${response.statusText}`);
        }
        return response.json();
    },
    async post(endpoint: string, body: any) {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Помилка запиту: ${response.statusText}`);
        }
        // Деякі POST-запити можуть не повертати тіло
        const text = await response.text();
        return text ? JSON.parse(text) : {};
    },
    async remove(endpoint: string) {
        const response = await fetch(`${API_URL}${endpoint}`, { method: 'DELETE' });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Помилка запиту: ${response.statusText}`);
        }
    }
};

export const getUsers = (): Promise<User[]> => {
    return api.get('/users');
};

export const addUser = (id: string, role: UserRole, name?: string): Promise<User> => {
     if (!id.trim()) {
        throw new Error('User ID cannot be empty.');
    }
    return api.post('/users', { id, role, name });
};

export const removeUser = (id: string): Promise<void> => {
    if (id.toLowerCase() === 'admin') {
         throw new Error("Cannot remove the default admin user.");
    }
    return api.remove(`/users/${id}`);
};

export const login = async (id: string, name?: string): Promise<User | null> => {
    try {
        const user = await api.post('/login', { id, name });
        sessionStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(user));
        return user;
    } catch (e) {
        console.error('Login failed:', e);
        return null;
    }
};

export const logout = (): void => {
    sessionStorage.removeItem(CURRENT_USER_SESSION_KEY);
};

export const getLoggedInUser = (): User | null => {
    try {
        const userJson = sessionStorage.getItem(CURRENT_USER_SESSION_KEY);
        if (!userJson) return null;
        return JSON.parse(userJson) as User;
    } catch (e) {
        console.error("Could not retrieve logged in user", e);
        logout();
        return null;
    }
};