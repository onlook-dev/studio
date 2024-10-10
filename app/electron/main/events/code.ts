import { ipcMain } from 'electron';
import { openInIde, pickDirectory, readCodeBlock, readCodeBlocks, writeCode } from '../code/';
import { getTemplateNodeClass } from '../code/classes';
import { extractComponentsFromDirectory } from '../code/components';
import { getCodeDiffs } from '../code/diff';
import { cleanMoveKeys } from '../code/moveKeys';
import { getTemplateNodeChild } from '../code/templateNode';
import { MainChannels } from '/common/constants';
import { CodeDiff, CodeDiffRequest } from '/common/models/code';
import { TemplateNode } from '/common/models/element/templateNode';

export function listenForCodeMessages() {
    ipcMain.handle(MainChannels.VIEW_SOURCE_CODE, (e: Electron.IpcMainInvokeEvent, args) => {
        const templateNode = args as TemplateNode;
        openInIde(templateNode);
    });

    ipcMain.handle(MainChannels.GET_CODE_BLOCK, (e: Electron.IpcMainInvokeEvent, args) => {
        const templateNode = args as TemplateNode;
        return readCodeBlock(templateNode);
    });

    ipcMain.handle(MainChannels.GET_CODE_BLOCKS, (e: Electron.IpcMainInvokeEvent, args) => {
        const templateNodes = args as TemplateNode[];
        return readCodeBlocks(templateNodes);
    });

    ipcMain.handle(MainChannels.GET_TEMPLATE_NODE_CLASS, (e: Electron.IpcMainInvokeEvent, args) => {
        const templateNode = args as TemplateNode;
        return getTemplateNodeClass(templateNode);
    });

    ipcMain.handle(MainChannels.WRITE_CODE_BLOCKS, async (e: Electron.IpcMainInvokeEvent, args) => {
        const codeResults = args as CodeDiff[];
        const res = await writeCode(codeResults);
        return res;
    });

    ipcMain.handle(MainChannels.GET_CODE_DIFFS, (e: Electron.IpcMainInvokeEvent, args) => {
        const requests = args as CodeDiffRequest[];
        return getCodeDiffs(requests);
    });

    ipcMain.handle(MainChannels.GET_TEMPLATE_NODE_CHILD, (e: Electron.IpcMainInvokeEvent, args) => {
        const { parent, child, index } = args as {
            parent: TemplateNode;
            child: TemplateNode;
            index: number;
        };
        return getTemplateNodeChild(parent, child, index);
    });

    ipcMain.handle(MainChannels.PICK_COMPONENTS_DIRECTORY, async () => {
        const result = await pickDirectory();
        if (result.canceled) {
            return null;
        }

        return result.filePaths.at(0) ?? null;
    });

    ipcMain.handle(MainChannels.GET_COMPONENTS, async (_, args) => {
        if (typeof args !== 'string') {
            throw new Error('`args` must be a string');
        }
        const result = extractComponentsFromDirectory(args);
        return result;
    });

    ipcMain.handle(MainChannels.CLEAN_MOVE_KEYS, async (_, args) => {
        const files = args as string[];
        const result = await cleanMoveKeys(files);
        return result;
    });
}
