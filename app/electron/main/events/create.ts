import {
    CreateCallback,
    CreateStage,
    VerifyCallback,
    VerifyStage,
    createProject,
    verifyProject,
} from '@onlook/utils';
import { ipcMain } from 'electron';
import { mainWindow } from '..';
import { MainChannels } from '/common/constants';

export function listenForCreateMessages() {
    ipcMain.handle(MainChannels.CREATE_NEW_PROJECT, (e: Electron.IpcMainInvokeEvent, args) => {
        const progressCallback: CreateCallback = (stage: CreateStage, message: string) => {
            mainWindow?.webContents.send(MainChannels.CREATE_NEW_PROJECT_CALLBACK, {
                stage,
                message,
            });
        };

        const { name, path } = args as { name: string; path: string };
        return createProject(name, path, progressCallback);
    });

    ipcMain.handle(MainChannels.VERIFY_PROJECT, (e: Electron.IpcMainInvokeEvent, args: string) => {
        const progressCallback: VerifyCallback = (stage: VerifyStage, message: string) => {
            mainWindow?.webContents.send(MainChannels.VERIFY_PROJECT_CALLBACK, {
                stage,
                message,
            });
        };
        const path = args as string;
        return verifyProject(path, progressCallback);
    });
}
