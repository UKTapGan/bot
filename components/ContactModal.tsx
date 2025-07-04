
import React from 'react';
import type { Contact } from '../types';
import { CloseIcon, UserCircleIcon } from './Icons';

interface ContactModalProps {
    contacts: Contact[];
    onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ contacts, onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div 
                className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg border border-slate-700 m-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">Контактна інформація</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700 transition-colors">
                        <CloseIcon className="h-6 w-6 text-slate-400" />
                    </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <ul className="space-y-4">
                        {contacts.map((contact, index) => (
                            <li key={index} className="flex items-center p-3 bg-slate-900/70 rounded-md">
                                <UserCircleIcon className="h-10 w-10 text-cyan-400 mr-4 shrink-0" />
                                <div className="flex-1">
                                    <p className="font-semibold text-white">{contact.name}</p>
                                    <p className="text-sm text-slate-400">{contact.position}</p>
                                </div>
                                <p className="text-sm font-mono bg-slate-700/50 px-2 py-1 rounded">{contact.tag}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};
