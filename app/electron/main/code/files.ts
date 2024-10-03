import { promises as fs, watch } from 'fs';
import * as path from 'path';
import prettier from 'prettier';

export async function readFile(filePath: string): Promise<string> {
    try {
        const fullPath = path.resolve(filePath);
        const data = await fs.readFile(fullPath, 'utf8');
        return data;
    } catch (error: any) {
        console.error('Error reading file:', error);
        throw error;
    }
}

export async function writeFile(filePath: string, content: string): Promise<void> {
    try {
        const fullPath = path.resolve(filePath);
        await fs.writeFile(fullPath, content, 'utf8');
    } catch (error: any) {
        console.error('Error writing to file:', error);
        throw error;
    }
}

export function watchFile(
    filePath: string,
    callback: (eventType: string, filename: string) => void,
): () => void {
    const fullPath = path.resolve(filePath);
    const watcher = watch(fullPath, (eventType, filename) => {
        if (filename) {
            callback(eventType, filename);
        }
    });
    return () => {
        watcher.close();
    };
}

export async function formatContent(filePath: string, content: string): Promise<string> {
    try {
        const config = (await prettier.resolveConfig(filePath)) || {};
        // Remove plugins because they may not be installed
        const formattedContent = await prettier.format(content, {
            ...config,
            filepath: filePath,
            plugins: [],
        });
        return formattedContent;
    } catch (error: any) {
        console.error('Error formatting file:', error);
        return content;
    }
}
