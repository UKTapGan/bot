
import mammoth from 'mammoth';
import type { ManualContent, ImageContent } from '../types';

/**
 * Processes a .docx file to extract its text and images.
 * @param file The .docx file to process.
 * @returns A promise that resolves to ManualContent object.
 */
export const processDocx = async (file: File): Promise<ManualContent> => {
    if (!file.name.endsWith('.docx')) {
        throw new Error('Неправильний формат файлу. Будь ласка, завантажте файл .docx.');
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (event) => {
            if (event.target?.result instanceof ArrayBuffer) {
                try {
                    const arrayBuffer = event.target.result;
                    
                    // Convert DOCX to HTML
                    const result = await mammoth.convertToHtml({ arrayBuffer });
                    const html = result.value;

                    // Parse HTML to extract text and images
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    // Extract text content
                    const textContent = doc.body.innerText || "";
                    
                    // Extract images as base64 strings along with their alt text
                    const images: ImageContent[] = [];
                    doc.querySelectorAll('img').forEach((img, index) => {
                        const src = img.getAttribute('src');
                        const alt = img.getAttribute('alt') || `Зображення ${index + 1} з документу`;
                        if (src && src.startsWith('data:image/')) {
                            images.push({
                                src: src,
                                description: alt,
                            });
                        }
                    });

                    resolve({
                        text: textContent,
                        images,
                        fileName: file.name,
                    });
                } catch (err) {
                    console.error("Помилка під час конвертації mammoth:", err);
                    reject(new Error('Не вдалося обробити документ.'));
                }
            } else {
                reject(new Error('Не вдалося прочитати файл.'));
            }
        };

        reader.onerror = (error) => {
            console.error("Помилка FileReader:", error);
            reject(new Error('Помилка читання файлу.'));
        };

        reader.readAsArrayBuffer(file);
    });
};