import { ipcMain } from 'electron';
import { openInVsCode, readCodeBlock, readCodeBlocks, writeCode } from '../code/';
import { getTemplateNodeChild } from '../code/ast';
import { getStyleCodeDiffs } from '../code/babel';
import { MainChannels } from '/common/constants';
import { StyleChangeParam, StyleCodeDiff } from '/common/models';
import { TemplateNode } from '/common/models/element/templateNode';

export function listenForCodeMessages() {
    ipcMain.handle(MainChannels.VIEW_SOURCE_CODE, (e: Electron.IpcMainInvokeEvent, args) => {
        const templateNode = args as TemplateNode;
        openInVsCode(templateNode);
    });

    ipcMain.handle(MainChannels.GET_CODE_BLOCK, (e: Electron.IpcMainInvokeEvent, args) => {
        const templateNode = args as TemplateNode;
        return readCodeBlock(templateNode);
    });

    ipcMain.handle(MainChannels.GET_CODE_BLOCKS, (e: Electron.IpcMainInvokeEvent, args) => {
        const templateNodes = args as TemplateNode[];
        return readCodeBlocks(templateNodes);
    });

    ipcMain.handle(MainChannels.WRITE_CODE_BLOCKS, async (e: Electron.IpcMainInvokeEvent, args) => {
        const codeResults = args as StyleCodeDiff[];
        const res = await writeCode(codeResults);
        return res;
    });

    ipcMain.handle(MainChannels.GET_STYLE_CODE_DIFFS, (e: Electron.IpcMainInvokeEvent, args) => {
        const styleParams = args as StyleChangeParam[];
        return getStyleCodeDiffs(styleParams);
    });

    ipcMain.handle(MainChannels.GET_TEMPLATE_NODE_CHILD, (e: Electron.IpcMainInvokeEvent, args) => {
        const { parent, child } = args as {
            parent: TemplateNode;
            child: TemplateNode;
        };
        return getTemplateNodeChild(parent, child);
    });
}
