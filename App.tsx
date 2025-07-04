import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { LoginScreen } from './components/LoginScreen';
import { UserManagementModal } from './components/UserManagementModal';
import { processDocx } from './services/docParserService';
import { generateChatResponse, generateTroubleshootingStep } from './services/geminiService';
import * as userService from './services/userService';
import type { ManualContent, Message, ImageContent, MessageOption, User } from './types';
import { MessageSender, UserRole, ChatMode } from './types';
import { CONTACTS } from './constants';
import { ContactModal } from './components/ContactModal';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';

// Declare Telegram WebApp type for typescript
declare global {
    interface Window {
        Telegram?: {
            WebApp: {
                initData: string;
                initDataUnsafe: {
                    user?: {
                        id: number;
                        first_name: string;
                        last_name?: string;
                        username?: string;
                    };
                };
                ready: () => void;
                onEvent: (eventType: string, eventHandler: () => void) => void;
                offEvent: (eventType: string, eventHandler: () => void) => void;
                MainButton: {
                    text: string;
                    show: () => void;
                    hide: () => void;
                    setText: (text: string) => void;
                };
            };
        };
    }
}

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [authStatus, setAuthStatus] = useState<'loading' | 'loggedIn' | 'accessDenied' | 'loginScreen'>('loading');
    
    const [manualContent, setManualContent] = useState<ManualContent | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
    const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
    const [chatMode, setChatMode] = useState<ChatMode>(ChatMode.QA);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const attemptTelegramLogin = () => {
            const tg = window.Telegram?.WebApp;
            
            if (tg && tg.initData) {
                tg.ready();
                const tgUser = tg.initDataUnsafe.user;

                if (tgUser && tgUser.id) {
                    const userName = `${tgUser.first_name} ${tgUser.last_name || ''}`.trim();
                    const loggedInUser = userService.login(tgUser.id.toString(), userName);

                    if (loggedInUser) {
                        setCurrentUser(loggedInUser);
                        setUsers(userService.getUsers());
                        setAuthStatus('loggedIn');
                    } else {
                        setAuthStatus('accessDenied');
                    }
                    return; 
                }
            }

            // Fallback for non-Telegram environment or missing user data
            const existingSessionUser = userService.getLoggedInUser();
            if (existingSessionUser) {
                setCurrentUser(existingSessionUser);
                setUsers(userService.getUsers());
                setAuthStatus('loggedIn');
            } else {
                setAuthStatus('loginScreen');
            }
        };

        attemptTelegramLogin();
    }, []);


    const handleLogin = useCallback(async (id: string): Promise<boolean> => {
        const user = userService.login(id);
        if (user) {
            setCurrentUser(user);
            setUsers(userService.getUsers());
            setAuthStatus('loggedIn');
            return true;
        }
        return false;
    }, []);

    const handleLogout = useCallback(() => {
        userService.logout();
        setCurrentUser(null);
        setMessages([]);
        setManualContent(null);
        setAuthStatus('loginScreen');
    }, []);

    const handleAddUser = (id: string, role: UserRole) => {
        try {
            userService.addUser(id, role);
            setUsers(userService.getUsers());
        } catch (e) {
            alert(e instanceof Error ? e.message : String(e));
        }
    };

    const handleRemoveUser = (id: string) => {
        try {
            userService.removeUser(id);
            setUsers(userService.getUsers());
        } catch (e) {
            alert(e instanceof Error ? e.message : String(e));
        }
    };

    const handleFileUpload = useCallback(async (file: File) => {
        setIsLoading(true);
        setManualContent(null);
        setMessages([]);
        try {
            const content = await processDocx(file);
            setManualContent(content);
            setMessages([{
                id: 'system-1',
                sender: MessageSender.SYSTEM,
                text: `Мануал "${content.fileName}" успішно завантажено. Виявлено ${content.images.length} зображень.`
            }]);
        } catch (err) {
            console.error("Помилка обробки файлу:", err);
            const errorMessage = err instanceof Error ? err.message : 'Невідома помилка під час обробки файлу.';
             setMessages([{
                id: 'error-1',
                sender: MessageSender.SYSTEM,
                text: `Помилка: ${errorMessage}. Спробуйте інший файл.`
            }]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const processAiResponseForImages = useCallback((responseText: string, messageId: string) => {
        if (!manualContent) return;

        const imageReferences: ImageContent[] = [];
        const imageRegex = /\[image (\d+)\]/g;
        let match;

        while ((match = imageRegex.exec(responseText)) !== null) {
            const imageNumber = parseInt(match[1], 10);
            const imageIndex = imageNumber - 1;
            if (manualContent.images && imageIndex >= 0 && imageIndex < manualContent.images.length) {
                const imageContent = manualContent.images[imageIndex];
                 if (!imageReferences.some(img => img.src === imageContent.src)) {
                    imageReferences.push(imageContent);
                }
            }
        }

        if (imageReferences.length > 0) {
            setMessages(prev => prev.map(msg =>
                msg.id === messageId ? { ...msg, images: imageReferences } : msg
            ));
        }
    }, [manualContent]);

    const handleSendMessage = useCallback(async (prompt: string) => {
        if (!manualContent) {
            setMessages(prev => [...prev, {
                id: 'system-error-' + Date.now(),
                sender: MessageSender.SYSTEM,
                text: 'Будь ласка, завантажте мануал через меню, щоб почати.'
            }]);
            return;
        }

        const userMessage: Message = { id: Date.now().toString(), sender: MessageSender.USER, text: prompt };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        const aiMessageId = (Date.now() + 1).toString();
        
        if (chatMode === ChatMode.TROUBLESHOOTING) {
             const initialAiMessage: Message = { id: aiMessageId, sender: MessageSender.AI, text: '' };
             setMessages(prev => [...prev, initialAiMessage]);
            try {
                 const history = messages.filter(m => m.sender !== MessageSender.SYSTEM);
                 const response = await generateTroubleshootingStep(prompt, manualContent, history);
                 const finalMessage: Message = {
                    id: aiMessageId,
                    sender: MessageSender.AI,
                    text: response.solution || response.question,
                    options: response.solution ? undefined : response.options.map(o => ({text: o, payload: o})),
                    isFinalStep: !!response.solution
                 };
                 setMessages(prev => prev.map(msg => msg.id === aiMessageId ? finalMessage : msg));
                 processAiResponseForImages(finalMessage.text, aiMessageId);
            } catch (err) {
                 console.error("Помилка відповіді від AI (Troubleshooting):", err);
                 const errorMessage = err instanceof Error ? err.message : 'Невідома помилка від сервісу AI.';
                 setMessages(prev => prev.map(msg =>
                    msg.id === aiMessageId ? { ...msg, text: `Вибачте, сталася помилка: ${errorMessage}` } : msg
                 ));
            } finally {
                setIsLoading(false);
            }
        } else { // QA mode
            const initialAiMessage: Message = { id: aiMessageId, sender: MessageSender.AI, text: '' };
            setMessages(prev => [...prev, initialAiMessage]);
            let fullAiResponseText = '';
            try {
                await generateChatResponse(prompt, manualContent, (chunk) => {
                    fullAiResponseText += chunk;
                    setMessages(prev => prev.map(msg =>
                        msg.id === aiMessageId ? { ...msg, text: fullAiResponseText } : msg
                    ));
                });
                processAiResponseForImages(fullAiResponseText, aiMessageId);
            } catch (err) {
                console.error("Помилка відповіді від AI (Q&A):", err);
                const errorMessage = err instanceof Error ? err.message : 'Невідома помилка від сервісу AI.';
                 setMessages(prev => prev.map(msg =>
                    msg.id === aiMessageId ? { ...msg, text: `Вибачте, сталася помилка: ${errorMessage}` } : msg
                ));
            } finally {
                setIsLoading(false);
            }
        }
    }, [manualContent, chatMode, messages, processAiResponseForImages]);

    const handleOptionClick = useCallback(async (option: MessageOption) => {
        if (!manualContent) return;

        const userMessage: Message = { id: Date.now().toString(), sender: MessageSender.USER, text: option.text };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        
        const aiMessageId = (Date.now() + 1).toString();
        const initialAiMessage: Message = { id: aiMessageId, sender: MessageSender.AI, text: '' };
        setMessages(prev => [...prev, initialAiMessage]);

        try {
            const history = [...messages, userMessage].filter(m => m.sender !== MessageSender.SYSTEM);
            const response = await generateTroubleshootingStep(option.payload, manualContent, history);
            const finalMessage: Message = {
                id: aiMessageId,
                sender: MessageSender.AI,
                text: response.solution || response.question,
                options: response.solution ? undefined : response.options.map(o => ({text: o, payload: o})),
                isFinalStep: !!response.solution
            };
            setMessages(prev => prev.map(msg => msg.id === aiMessageId ? finalMessage : msg));
            processAiResponseForImages(finalMessage.text, aiMessageId);
        } catch (err) {
            console.error("Помилка відповіді від AI (Troubleshooting Step):", err);
            const errorMessage = err instanceof Error ? err.message : 'Невідома помилка від сервісу AI.';
            setMessages(prev => prev.map(msg =>
               msg.id === aiMessageId ? { ...msg, text: `Вибачте, сталася помилка: ${errorMessage}` } : msg
            ));
        } finally {
            setIsLoading(false);
        }
    }, [manualContent, messages, processAiResponseForImages]);


    if (authStatus === 'loading') {
        return <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-300">Завантаження...</div>;
    }

    if (authStatus === 'accessDenied') {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-center p-4">
                <h1 className="text-2xl font-bold text-red-400">Доступ заборонено</h1>
                <p className="text-slate-400 mt-2">Ваш Telegram акаунт не має дозволу на використання цього додатку.<br/>Будь ласка, зверніться до адміністратора.</p>
            </div>
        );
    }

    if (authStatus === 'loginScreen' || !currentUser) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    const canManageUsers = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_USER;

    return (
        <div className="flex h-screen bg-slate-900 text-slate-100">
             <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                className="hidden"
                accept=".docx"
                disabled={isLoading}
            />

            {/* Desktop Sidebar */}
            <div className="hidden lg:flex lg:flex-shrink-0">
                <Sidebar
                    user={currentUser}
                    onFileUploadClick={handleUploadClick}
                    isLoading={isLoading}
                    manualFileName={manualContent?.fileName || null}
                    onShowContacts={() => setIsContactsModalOpen(true)}
                    onShowUserManagement={() => setIsUserManagementModalOpen(true)}
                    onLogout={handleLogout}
                />
            </div>
            
            <div className="flex flex-col flex-1 min-w-0">
                {/* Mobile Header */}
                <div className="lg:hidden">
                    <Header
                        user={currentUser}
                        onFileUploadClick={handleUploadClick}
                        onShowContacts={() => setIsContactsModalOpen(true)}
                        onShowUserManagement={() => setIsUserManagementModalOpen(true)}
                        onLogout={handleLogout}
                    />
                </div>

                <main className="flex-1 flex flex-col min-h-0">
                    <ChatInterface
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        isLoading={isLoading}
                        isManualLoaded={!!manualContent}
                        chatMode={chatMode}
                        onChatModeChange={setChatMode}
                        onOptionClick={handleOptionClick}
                        manualFileName={manualContent?.fileName || null}
                    />
                </main>
            </div>
            
            {isContactsModalOpen && (
                <ContactModal
                    contacts={CONTACTS}
                    onClose={() => setIsContactsModalOpen(false)}
                />
            )}
            {isUserManagementModalOpen && canManageUsers && (
                <UserManagementModal
                    currentUser={currentUser}
                    users={users}
                    onAddUser={handleAddUser}
                    onRemoveUser={handleRemoveUser}
                    onClose={() => setIsUserManagementModalOpen(false)}
                />
            )}
        </div>
    );
};

export default App;