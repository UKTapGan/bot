import React, { useState } from 'react';
import { KeyIcon, UvapeLogoIcon } from './Icons';

interface LoginScreenProps {
    onLogin: (id: string) => Promise<boolean>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [id, setId] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!id.trim()) {
            setError('Будь ласка, введіть ваш Telegram ID.');
            return;
        }
        setIsLoading(true);
        const success = await onLogin(id.trim());
        if (!success) {
            setError('Доступ заборонено. Перевірте ваш ID або зверніться до адміністратора.');
        }
        setIsLoading(false);
    };

    return (
        <div className="flex items-center justify-center h-screen bg-slate-900">
            <div className="w-full max-w-sm mx-auto p-8 bg-slate-800/50 border border-slate-700/50 rounded-2xl shadow-xl">
                <div className="flex flex-col items-center mb-6">
                    <UvapeLogoIcon className="h-16 w-16 text-cyan-400 mb-3" />
                    <h1 className="text-2xl font-bold text-white">Вхід до Помічника</h1>
                    <p className="text-slate-400">Введіть ваш Telegram ID для доступу</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="tg-id" className="sr-only">Telegram ID</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <KeyIcon className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                id="tg-id"
                                type="text"
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                placeholder="Ваш Telegram ID"
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg py-3 pl-10 pr-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                autoComplete="username"
                            />
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? 'Перевірка...' : 'Увійти'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
