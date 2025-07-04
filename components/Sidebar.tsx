import React from 'react';
import { UserRole, User } from '../types';
import { FileUploadIcon, UsersIcon, GlobeIcon, CheckCircleIcon, UvapeLogoIcon, LogoutIcon, UserManagementIcon } from './Icons';

interface SidebarProps {
    onFileUploadClick: () => void;
    isLoading: boolean;
    manualFileName: string | null;
    onShowContacts: () => void;
    user: User;
    onLogout: () => void;
    onShowUserManagement: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onFileUploadClick, isLoading, manualFileName, onShowContacts, user, onLogout, onShowUserManagement }) => {
    const canUpload = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_USER;
    const canManageUsers = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_USER;

    return (
        <aside className="w-64 bg-slate-800/50 p-4 flex flex-col border-r border-slate-700/50">
            <div className="flex items-center gap-3 mb-8">
                <UvapeLogoIcon className="h-10 w-10 text-cyan-400" />
                <div>
                    <h1 className="text-xl font-bold text-white">Помічник</h1>
                    <p className="text-sm text-slate-400">UVAPE</p>
                </div>
            </div>
            
            <nav className="flex flex-col space-y-2 flex-1">
                {canUpload && (
                    <button
                        onClick={onFileUploadClick}
                        disabled={isLoading}
                        className="flex items-center w-full px-3 py-2 text-left text-slate-200 hover:bg-slate-700 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FileUploadIcon className="h-5 w-5 mr-3" />
                        <span>Завантажити мануал</span>
                    </button>
                )}

                <button
                    onClick={onShowContacts}
                    className="flex items-center w-full px-3 py-2 text-left text-slate-200 hover:bg-slate-700 rounded-md transition-colors duration-200"
                >
                    <UsersIcon className="h-5 w-5 mr-3" />
                    <span>Контактна інформація</span>
                </button>
                
                {canManageUsers && (
                     <button
                        onClick={onShowUserManagement}
                        className="flex items-center w-full px-3 py-2 text-left text-slate-200 hover:bg-slate-700 rounded-md transition-colors duration-200"
                    >
                        <UserManagementIcon className="h-5 w-5 mr-3" />
                        <span>Керування</span>
                    </button>
                )}

                <a
                    href="https://uvape.pro/ua"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center w-full px-3 py-2 text-left text-slate-200 hover:bg-slate-700 rounded-md transition-colors duration-200"
                >
                    <GlobeIcon className="h-5 w-5 mr-3" />
                    <span>Перейти на сайт</span>
                </a>
            </nav>

            <div className="mt-auto space-y-4">
                {isLoading && (
                    <div className="text-sm text-cyan-400 animate-pulse">Обробка файлу...</div>
                )}
                {manualFileName && !isLoading && (
                    <div className="p-3 bg-green-900/50 border border-green-700/50 rounded-lg">
                        <div className="flex items-center text-green-300">
                           <CheckCircleIcon className="h-5 w-5 mr-2 shrink-0" />
                            <span className="font-semibold">Мануал активний:</span>
                        </div>
                        <p className="text-sm text-slate-300 mt-1 truncate" title={manualFileName}>{manualFileName}</p>
                    </div>
                )}
                
                <div className="pt-4 border-t border-slate-700/50 space-y-3">
                    <div className="text-sm">
                        <p className="font-semibold text-slate-200 truncate" title={user.name || user.id}>
                            {user.name || user.id}
                        </p>
                        <p className="text-slate-400 capitalize">{user.role.replace('_', ' ')}</p>
                        {user.name && (
                            <p className="text-slate-500 text-xs font-mono truncate" title={user.id}>
                                ID: {user.id}
                            </p>
                        )}
                    </div>
                     <button
                        onClick={onLogout}
                        className="flex items-center justify-center w-full px-3 py-2 text-left text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors duration-200"
                    >
                        <LogoutIcon className="h-5 w-5 mr-2" />
                        <span>Вийти</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};
