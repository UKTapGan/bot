import React, { useState } from 'react';
import type { User } from '../types';
import { UserRole } from '../types';
import { UvapeLogoIcon, MenuIcon, CloseIcon, FileUploadIcon, UsersIcon, UserManagementIcon, GlobeIcon, LogoutIcon } from './Icons';

interface HeaderProps {
    user: User;
    onFileUploadClick: () => void;
    onShowContacts: () => void;
    onShowUserManagement: () => void;
    onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onFileUploadClick, onShowContacts, onShowUserManagement, onLogout }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const canUpload = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_USER;
    const canManageUsers = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_USER;

    const menuItems = [
        canUpload && { label: 'Завантажити мануал', icon: FileUploadIcon, action: onFileUploadClick },
        { label: 'Контактна інформація', icon: UsersIcon, action: onShowContacts },
        canManageUsers && { label: 'Керування', icon: UserManagementIcon, action: onShowUserManagement },
        { label: 'Перейти на сайт', icon: GlobeIcon, action: () => window.open('https://uvape.pro/ua', '_blank') },
    ];

    const handleMenuItemClick = (action: () => void) => {
        action();
        setIsMenuOpen(false);
    }

    return (
        <>
            <header className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 p-3 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <UvapeLogoIcon className="h-8 w-8 text-cyan-400" />
                    <h1 className="text-lg font-bold text-white">Помічник</h1>
                </div>
                
                <button onClick={() => setIsMenuOpen(true)} className="p-2 rounded-full hover:bg-slate-700 transition-colors">
                    <MenuIcon className="h-6 w-6 text-slate-200" />
                </button>
            </header>

            {/* Slide-out Menu */}
            <div 
                className={`fixed inset-0 z-30 transition-opacity duration-300 ${isMenuOpen ? 'bg-black/60 backdrop-blur-sm' : 'pointer-events-none bg-transparent'}`}
                onClick={() => setIsMenuOpen(false)}
            >
                <div 
                    className={`fixed top-0 right-0 h-full w-full max-w-xs bg-slate-800 shadow-lg z-40 flex flex-col border-l border-slate-700 transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center p-4 border-b border-slate-700">
                         <h2 className="text-xl font-bold text-white">Меню</h2>
                         <button onClick={() => setIsMenuOpen(false)} className="p-1 rounded-full hover:bg-slate-700">
                             <CloseIcon className="h-6 w-6 text-slate-300"/>
                         </button>
                    </div>
                    
                    <nav className="flex-1 p-2 space-y-1">
                        {menuItems.map((item, index) => (
                            item && (
                            <button key={index} onClick={() => handleMenuItemClick(item.action)} className="flex items-center w-full px-3 py-3 text-left text-slate-200 hover:bg-slate-700 rounded-md transition-colors">
                                <item.icon className="h-5 w-5 mr-3 shrink-0" />
                                <span>{item.label}</span>
                            </button>
                            )
                        ))}
                    </nav>

                    <div className="p-4 mt-auto">
                        <div className="pt-4 border-t border-slate-700/50 space-y-3">
                            <div className="text-sm">
                                <p className="font-semibold text-slate-200 truncate" title={user.name || user.id}>
                                    {user.name || user.id}
                                </p>
                                <p className="text-slate-400 capitalize">{user.role.replace('_', ' ')}</p>
                            </div>
                            <button onClick={() => handleMenuItemClick(onLogout)} className="flex items-center justify-center w-full px-3 py-2 text-left text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors duration-200">
                                <LogoutIcon className="h-5 w-5 mr-2" />
                                <span>Вийти</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
