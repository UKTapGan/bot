import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Message, MessageOption } from '../types';
import { MessageSender, ChatMode } from '../types';
import { SendIcon, BotIcon, UserIcon, SystemIcon, LoadingIcon, WrenchScrewdriverIcon, QuestionMarkCircleIcon, CheckCircleIcon } from './Icons';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
    messages: Message[];
    onSendMessage: (prompt: string) => void;
    isLoading: boolean;
    isManualLoaded: boolean;
    chatMode: ChatMode;
    onChatModeChange: (mode: ChatMode) => void;
    onOptionClick: (option: MessageOption) => void;
    manualFileName: string | null;
}

const ChatMessage: React.FC<{ message: Message, onOptionClick: (option: MessageOption) => void, isLoading: boolean }> = ({ message, onOptionClick, isLoading }) => {
    const isUser = message.sender === MessageSender.USER;
    const isSystem = message.sender === MessageSender.SYSTEM;

    const Icon = isUser ? UserIcon : (isSystem ? SystemIcon : BotIcon);
    const bgColor = isUser ? 'bg-cyan-900/50' : (isSystem ? 'bg-slate-700/80' : 'bg-slate-800');
    
    if (isSystem) {
        return (
            <div className="flex items-center justify-center my-4">
                <div className="flex items-center gap-3 px-4 py-2 text-sm text-slate-400 bg-slate-800 rounded-full">
                    <Icon className="h-5 w-5" />
                    <span>{message.text}</span>
                </div>
            </div>
        );
    }

    const hasOptions = message.options && message.options.length > 0;
    const isFinalStep = message.isFinalStep;

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
            <div className={`flex items-start gap-3 max-w-2xl`}>
                {!isUser && <div className="p-2 bg-slate-700 rounded-full mt-1"><Icon className="h-6 w-6 text-cyan-400" /></div>}
                <div className="flex flex-col">
                    <div className={`${bgColor} rounded-lg p-4 w-full ${isFinalStep ? 'border-2 border-green-500/50' : ''}`}>
                         {isFinalStep && (
                            <div className="flex items-center gap-2 mb-2 text-green-400 font-semibold">
                                <CheckCircleIcon className="h-5 w-5" />
                                <span>Рішення знайдено</span>
                            </div>
                        )}
                        <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 text-slate-200">
                            <ReactMarkdown>{message.text}</ReactMarkdown>
                        </div>
                        {message.images && message.images.length > 0 && (
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {message.images.map((image, index) => (
                                    <div key={index} className="space-y-2">
                                        <a href={image.src} target="_blank" rel="noopener noreferrer" className="block border border-slate-600 rounded-lg overflow-hidden hover:border-cyan-500 transition-all duration-200">
                                            <img
                                                src={image.src}
                                                alt={image.description}
                                                className="w-full h-auto object-cover bg-slate-700"
                                            />
                                        </a>
                                        <p className="text-xs text-slate-400 text-center italic">{image.description}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {hasOptions && (
                        <div className="mt-3 flex flex-wrap gap-2 items-center justify-start">
                            {message.options?.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => onOptionClick(option)}
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-full text-sm transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
                                >
                                    {option.text}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                 {isUser && <div className="p-2 bg-slate-700 rounded-full mt-1"><Icon className="h-6 w-6 text-slate-300" /></div>}
            </div>
        </div>
    );
};


export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading, isManualLoaded, chatMode, onChatModeChange, onOptionClick, manualFileName }) => {
    const [prompt, setPrompt] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isTgReady, setIsTgReady] = useState(false);
    
    const tg = window.Telegram?.WebApp;
    const lastMessage = messages[messages.length - 1];
    const isWaitingForOption = !isLoading && lastMessage?.sender === MessageSender.AI && lastMessage.options && lastMessage.options.length > 0;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    const handleMainButtonClick = useCallback(() => {
        if (prompt.trim() && !isLoading && isManualLoaded && !isWaitingForOption) {
            onSendMessage(prompt.trim());
            setPrompt('');
        }
    }, [prompt, isLoading, isManualLoaded, isWaitingForOption, onSendMessage]);

    useEffect(() => {
        if (tg) {
            if(!isTgReady) {
                tg.ready();
                setIsTgReady(true);
            }
            tg.onEvent('mainButtonClicked', handleMainButtonClick);
            return () => {
                tg.offEvent('mainButtonClicked', handleMainButtonClick);
            };
        }
    }, [tg, handleMainButtonClick, isTgReady]);

    useEffect(() => {
        if (!isTgReady || !tg) return;
        
        const canSendMessage = prompt.trim() !== '' && isManualLoaded && !isLoading && !isWaitingForOption;

        if (canSendMessage) {
            tg.MainButton.setText('Надіслати');
            tg.MainButton.show();
        } else {
            tg.MainButton.hide();
        }
    }, [prompt, isManualLoaded, isLoading, isWaitingForOption, isTgReady, tg]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleMainButtonClick();
    };

    const getPlaceholderText = () => {
        if (!isManualLoaded) return "Завантажте мануал через меню...";
        if (isLoading) return "Асистент думає...";
        if (isWaitingForOption) return "Будь ласка, виберіть опцію вище...";
        if (chatMode === ChatMode.TROUBLESHOOTING) {
             return messages.some(m => m.sender === MessageSender.AI) ? "Оберіть опцію або почніть нову діагностику..." : "Опишіть вашу проблему для діагностики...";
        }
        return "Поставте ваше питання...";
    }

    return (
        <div className="flex-1 flex flex-col bg-slate-900 p-4 h-full min-h-0">
            <div className="pb-4 px-2 border-b border-slate-700/50 mb-4">
                <div className="bg-slate-800 p-1 rounded-lg flex w-full max-w-sm mx-auto">
                    <button onClick={() => onChatModeChange(ChatMode.QA)} className={`w-1/2 py-2 px-3 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-300 ${chatMode === ChatMode.QA ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                        <QuestionMarkCircleIcon className="h-5 w-5" />
                        Питання-Відповідь
                    </button>
                    <button onClick={() => onChatModeChange(ChatMode.TROUBLESHOOTING)} className={`w-1/2 py-2 px-3 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-300 ${chatMode === ChatMode.TROUBLESHOOTING ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                        <WrenchScrewdriverIcon className="h-5 w-5" />
                        Діагностика
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                 {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-4">
                        <BotIcon className="w-16 h-16 mb-4"/>
                        <h2 className="text-xl font-medium text-slate-300">Помічник готовий до роботи</h2>
                         {isManualLoaded ? (
                             <p className="text-slate-400 mt-1">Активний мануал: <span className="font-semibold text-slate-300">{manualFileName}</span></p>
                        ) : (
                            <p className="mt-1">Будь ласка, завантажте мануал через меню, щоб почати.</p>
                        )}
                    </div>
                )}
                {messages.map((msg) => <ChatMessage key={msg.id} message={msg} onOptionClick={onOptionClick} isLoading={isLoading}/>)}
                {isLoading && messages.length > 0 && messages[messages.length-1].sender === MessageSender.USER && (
                    <div className="flex justify-start mb-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-slate-700 rounded-full mt-1"><BotIcon className="h-6 w-6 text-cyan-400" /></div>
                            <div className="bg-slate-800 rounded-lg p-4 flex items-center">
                                <LoadingIcon className="h-5 w-5 animate-spin" />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="mt-auto pt-4 border-t border-slate-700/50">
                <form onSubmit={handleSubmit} className="relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={getPlaceholderText()}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pl-4 pr-12 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-slate-800/70 resize-none"
                        rows={1}
                        disabled={isLoading || !isManualLoaded || isWaitingForOption}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                handleSubmit(e);
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !prompt.trim() || !isManualLoaded || isWaitingForOption}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                    >
                        <SendIcon className="h-5 w-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};
