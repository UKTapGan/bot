import type { User } from '../types';
import { UserRole } from '../types';

const USERS_STORAGE_KEY = 'uvape_assistant_users';
const CURRENT_USER_ID_KEY = 'uvape_assistant_currentUserId';
const DEFAULT_ADMIN_ID = 'admin'; // Default admin TG ID

// Ensure there's always a default admin user
const initializeUsers = (): User[] => {
    try {
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        if (storedUsers) {
            const users = JSON.parse(storedUsers) as User[];
            // Ensure default admin exists
            if (!users.some(u => u.id.toLowerCase() === DEFAULT_ADMIN_ID)) {
                users.push({ id: DEFAULT_ADMIN_ID, name: 'Головний Адміністратор', role: UserRole.ADMIN });
                localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
            }
            return users;
        }
    } catch (error) {
        console.error("Failed to parse users from localStorage", error);
    }
    
    // Default case: no users stored or parsing failed
    const defaultUsers: User[] = [
        { id: DEFAULT_ADMIN_ID, name: 'Головний Адміністратор', role: UserRole.ADMIN },
        { id: '7350287247', name: 'Супер Користувач', role: UserRole.SUPER_USER },
        { id: '12345678', name: 'Тестовий Користувач', role: UserRole.USER },
    ];
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
};


export const getUsers = (): User[] => {
    return initializeUsers();
};

const saveUsers = (users: User[]): void => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const addUser = (id: string, role: UserRole): User => {
    if (!id.trim()) {
        throw new Error('User ID cannot be empty.');
    }
    const users = getUsers();
    if (users.some(user => user.id.toLowerCase() === id.trim().toLowerCase())) {
        throw new Error(`User with ID "${id}" already exists.`);
    }
    const newUser: User = { id: id.trim(), role };
    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);
    return newUser;
};

export const removeUser = (id: string): void => {
    let users = getUsers();
    if (id.toLowerCase() === DEFAULT_ADMIN_ID) {
         throw new Error("Cannot remove the default admin user.");
    }
    const updatedUsers = users.filter(user => user.id.toLowerCase() !== id.toLowerCase());
    saveUsers(updatedUsers);
};

export const findUserById = (id: string): User | undefined => {
    const users = getUsers();
    return users.find(user => user.id.toLowerCase() === id.toLowerCase());
};

export const login = (id: string, name?: string): User | null => {
    const users = getUsers();
    const userIndex = users.findIndex(user => user.id.toLowerCase() === id.toLowerCase());

    if (userIndex > -1) {
        const user = { ...users[userIndex] };
        let hasChanged = false;

        // Update user's name if it's provided and different from the stored one
        if (name && user.name !== name) {
            user.name = name;
            hasChanged = true;
        }

        if (hasChanged) {
            const updatedUsers = [...users];
            updatedUsers[userIndex] = user;
            saveUsers(updatedUsers);
        }

        localStorage.setItem(CURRENT_USER_ID_KEY, user.id);
        return user;
    }
    return null;
};

export const logout = (): void => {
    localStorage.removeItem(CURRENT_USER_ID_KEY);
};

export const getLoggedInUser = (): User | null => {
    try {
        const loggedInUserId = localStorage.getItem(CURRENT_USER_ID_KEY);
        if (!loggedInUserId) {
            return null;
        }
        return findUserById(loggedInUserId) || null;
    } catch(e) {
        console.error("Could not retrieve logged in user", e);
        logout();
        return null;
    }
};