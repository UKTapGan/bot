import { GoogleGenAI } from "@google/genai";
import type { ManualContent, Message } from '../types';

// Змінна на рівні модуля для зберігання ініціалізованого клієнта AI.
// Це реалізує патерн "Singleton", щоб ми не створювали клієнт щоразу.
let ai: GoogleGenAI | null = null;

/**
 * Отримує або ініціалізує клієнт GoogleGenAI.
 * Ця функція гарантує, що клієнт створюється лише один раз.
 * Ключ API має бути наданий через змінні середовища.
 *
 * @throws {Error} Викидає помилку, якщо ключ API не надано.
 * @returns {GoogleGenAI} Ініціалізований екземпляр клієнта AI.
 */
const getAiClient = (): GoogleGenAI => {
    // Якщо клієнт вже ініціалізовано, просто повертаємо його.
    if (ai) {
        return ai;
    }

    // Ключ API надається середовищем виконання згідно з вимогами.
    const apiKey = process.env.API_KEY;

    // Ця перевірка гарантує, що ключ API доступний під час виконання.
    if (!apiKey) {
        // У середовищі, для якого розробляється застосунок, ця помилка не повинна виникати.
        throw new Error("Ключ API не надано. Переконайтеся, що він встановлений у середовищі виконання.");
    }

    // Ініціалізуємо клієнт, зберігаємо його і повертаємо для використання.
    ai = new GoogleGenAI({ apiKey });
    return ai;
}


/**
 * Generates a response from the AI based on a prompt and manual content for standard Q&A.
 * @param prompt The user's question.
 * @param manual The parsed content of the manual.
 * @param onChunk A callback function to handle streaming response chunks.
 * @returns A promise that resolves when the stream is complete.
 */
export const generateChatResponse = async (
    prompt: string,
    manual: ManualContent,
    onChunk: (chunk: string) => void
): Promise<void> => {
    try {
        const localAi = getAiClient(); // Отримуємо або ініціалізуємо клієнт.

        const imageInstructions = manual.images.length > 0
            ? `У цьому мануалі є ${manual.images.length} зображен(ь). Якщо це доречно для відповіді, посилайся на них, використовуючи спеціальний формат [image N], де N - це номер зображення, починаючи з 1. Наприклад: "Для налаштування дивіться [image 1]." Не вигадуй зображення, використовуй лише ті, що є в мануалі.`
            : 'У цьому мануалі немає зображень.';

        const systemInstruction = `Ти — 'Помічник UVAPE', експертний асистент. Твої знання суворо обмежені змістом наданого мануалу. Відповідай на запитання користувача, базуючись виключно на цьому документі.
${imageInstructions}
Будь ласка, будь лаконічним, корисним і точним.
---
ЗМІСТ МАНУАЛУ:
${manual.text}
---
`;

        const stream = await localAi.models.generateContentStream({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        for await (const chunk of stream) {
            const text = chunk.text;
            if (text) {
                onChunk(text);
            }
        }

    } catch (error) {
        console.error("Error generating content from Gemini:", error);
        // Повторно викидаємо помилку, щоб шар UI міг її перехопити і показати користувачеві.
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Не вдалося отримати відповідь від ШІ. Перевірте консоль для деталей.");
    }
};


interface TroubleshootingResponse {
    question: string;
    options: string[];
    solution: string | null;
}

/**
 * Generates a structured response for the troubleshooting mode.
 * @param prompt The user's problem description or choice.
 * @param manual The parsed content of the manual.
 * @param history The chat history for context.
 * @returns A promise that resolves to a structured troubleshooting step.
 */
export const generateTroubleshootingStep = async (
    prompt: string,
    manual: ManualContent,
    history: Message[]
): Promise<TroubleshootingResponse> => {
    try {
        const localAi = getAiClient(); // Отримуємо або ініціалізуємо клієнт.

        const systemInstruction = `Ти — 'Помічник з діагностики UVAPE'. Твоя мета — покроково діагностувати проблему користувача, базуючись ВИКЛЮЧНО на наданому мануалі.
- Завжди став уточнюючі питання, щоб звузити проблему.
- Відповідай ТІЛЬКИ валідним JSON об'єктом. Не додавай жодного тексту до або після JSON.
- Формат JSON має бути таким: \`{"question": string, "options": string[], "solution": string | null}\`.
- \`question\`: Питання, яке потрібно поставити користувачеві.
- \`options\`: Масив коротких, чітких варіантів відповіді для користувача. Якщо ти надаєш фінальне рішення, цей масив може бути порожнім.
- \`solution\`: Якщо ти визначив остаточне рішення, надай детальний опис тут (включаючи посилання на зображення, наприклад, [image N]). В іншому випадку, це поле має бути \`null\`.
- Посилайся на зображення з мануалу, використовуючи формат [image N], де N - номер зображення (починаючи з 1).

Початок змісту мануалу:
---
${manual.text}
---
`;

        const contents = history.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));
        contents.push({ role: 'user', parts: [{ text: prompt }] });

        const response = await localAi.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
            },
        });
        
        const responseText = response.text;
        if (!responseText) {
             throw new Error('Асистент надав відповідь, але вона порожня.');
        }
        let jsonStr = responseText.trim();

        const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[1]) {
            jsonStr = match[1].trim();
        }

        try {
            const parsedData = JSON.parse(jsonStr) as TroubleshootingResponse;
            return parsedData;
        } catch (e) {
            console.error("Failed to parse JSON response from AI:", jsonStr, e);
            throw new Error('Асистент надав відповідь у неочікуваному форматі.');
        }

    } catch (error) {
        console.error("Error generating troubleshooting step from Gemini:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Не вдалося отримати крок діагностики від ШІ.");
    }
};