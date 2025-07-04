import React, { useState } from 'react';
import type { User } from '../types';
import { UserRole } from '../types';
import { CloseIcon, UserPlusIcon, TrashIcon, UserCircleIcon } from './Icons';

interface UserManagementModalProps {
    currentUser: User;
    users: User[];
    onAddUser: (id: string, role: UserRole) => void;
    onRemoveUser: (id: string) => void;
    onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ currentUser, users, onAddUser, onRemoveUser, onClose }) => {
    const [newUserId, setNewUserId] = useState('');
    const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.USER);

    const isCurrentUserAdmin = currentUser.role === UserRole.ADMIN;

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (newUserId.trim()) {
            onAddUser(newUserId.trim(), newUserRole);
            setNewUserId('');
            setNewUserRole(UserRole.USER);
        }
    };
    
    return (
        <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div 
                className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl border border-slate-700 m-4 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-slate-700 shrink-0">
                    <h2 className="text-xl font-bold text-white">Керування користувачами</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700 transition-colors">
                        <CloseIcon className="h-6 w-6 text-slate-400" />
                    </button>
                </div>
                
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {/* Add User Form */}
                    <form onSubmit={handleAddUser} className="mb-6 bg-slate-900/50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-3 text-white">Додати нового користувача</h3>
                        <div className="mb-3">
                            <input
                                type="text"
                                placeholder="Telegram ID користувача (обов'язково)"
                                value={newUserId}
                                required
                                onChange={(e) => setNewUserId(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <select
                                value={newUserRole}
                                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                                className="flex-grow bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value={UserRole.USER}>Користувач</option>
                                <option value={UserRole.SUPER_USER}>Супер-користувач</option>
                                {isCurrentUserAdmin && <option value={UserRole.ADMIN}>Адміністратор</option>}
                            </select>
                            <button type="submit" className="flex items-center justify-center px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-md transition-colors duration-200 disabled:bg-slate-600" disabled={!newUserId.trim()}>
                                <UserPlusIcon className="h-5 w-5 mr-2"/>
                                Додати
                            </button>
                        </div>
                    </form>

                    {/* Users List */}
                    <h3 className="text-lg font-semibold mb-3 text-white">Список користувачів</h3>
                    <ul className="space-y-3">
                        {users.map((user) => (
                            <li key={user.id} className="flex items-center p-3 bg-slate-900/70 rounded-md">
                                <UserCircleIcon className="h-8 w-8 text-cyan-400 mr-4 shrink-0" />
                                <div className="flex-1 overflow-hidden">
                                     <p className="font-semibold text-white truncate" title={user.name || user.id}>
                                        {user.name || <span className="italic text-slate-400">Ім'я буде отримано з Telegram</span>}
                                    </p>
                                    <div className="text-sm text-slate-400 flex items-center gap-x-2 flex-wrap">
                                        <span className="font-mono truncate" title={user.id}>{user.id}</span>
                                        <span className="text-slate-600 hidden sm:inline">•</span>
                                        <span className="capitalize">{user.role.replace('_', ' ')}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => onRemoveUser(user.id)} 
                                    disabled={
                                        user.id === currentUser.id ||
                                        user.id === 'admin' ||
                                        (!isCurrentUserAdmin && user.role === UserRole.ADMIN)
                                    }
                                    className="flex items-center gap-2 ml-4 px-3 py-1.5 rounded-md text-sm bg-slate-700/50 text-red-400/80 hover:bg-red-900/50 hover:text-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-slate-700/50 disabled:text-slate-500 disabled:hover:bg-slate-700/50 disabled:hover:text-slate-500"
                                    title={
                                        user.id === currentUser.id ? "Не можна видалити себе" :
                                        user.id === 'admin' ? "Не можна видалити головного адміністратора" :
                                        (!isCurrentUserAdmin && user.role === UserRole.ADMIN) ? "Недостатньо прав для видалення адміністратора" :
                                        "Видалити користувача"
                                    }
                                >
                                    <TrashIcon className="h-4 w-4" />
                                    <span>Видалити</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};