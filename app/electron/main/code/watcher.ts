import { readFile, watchFile } from './files';
import { MainChannels } from '/common/constants';

class FileWatcher {
    private static instance: FileWatcher;
    private watchers: Map<string, () => void> = new Map();

    private constructor() {}

    public static getInstance(): FileWatcher {
        if (!FileWatcher.instance) {
            FileWatcher.instance = new FileWatcher();
        }
        return FileWatcher.instance;
    }

    public watchFile(
        path: string,
        listenerId: string,
        sender: Electron.WebContents,
    ): Promise<string> {
        this.cancelWatch(listenerId);

        const cancelWatch = watchFile(path, async () => {
            const content = await readFile(path);
            sender.send(MainChannels.FILE_CONTENT_CHANGED, { path, content, listenerId });
        });

        this.watchers.set(listenerId, cancelWatch);
        return readFile(path);
    }

    public cancelWatch(listenerId: string): void {
        const cancelWatch = this.watchers.get(listenerId);
        if (cancelWatch) {
            cancelWatch();
            this.watchers.delete(listenerId);
        }
    }

    public cancelAllWatches(): void {
        for (const [listenerId, cancelWatch] of this.watchers) {
            cancelWatch();
            this.watchers.delete(listenerId);
        }
    }
}

export default FileWatcher.getInstance();
