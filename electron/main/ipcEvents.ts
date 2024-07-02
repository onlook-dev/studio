
import { ipcMain } from "electron";
import { writeStyle } from "./code";
import { openInVsCode, writeBlock } from "./code/files";
import { TunnelService } from "./tunnel";
import { MainChannels } from "/common/constants";
import { CodeResult, TemplateNode, WriteStyleParams } from "/common/models";

export function listenForIpcMessages(webviewPreload: string) {
    const tunnelService = new TunnelService()

    ipcMain.handle(MainChannels.WEBVIEW_PRELOAD_PATH, () => {
        return webviewPreload
    })

    ipcMain.handle(MainChannels.OPEN_CODE_BLOCK, (e: Electron.IpcMainInvokeEvent, args) => {
        const templateNode = args as TemplateNode
        openInVsCode(templateNode)
    })

    ipcMain.handle(MainChannels.WRITE_CODE_BLOCK, async (e: Electron.IpcMainInvokeEvent, args) => {
        try {
            const codeResults = args as CodeResult[]
            for (const result of codeResults) {
                await writeBlock(result.param.templateNode, result.generated)
            }
        } catch (error: any) {
            console.error('Error writing code block:', error);
            return false
        }
        return true
    })

    ipcMain.handle(MainChannels.GET_STYLE_CODE, (e: Electron.IpcMainInvokeEvent, args) => {
        const writeStylePrams = args as WriteStyleParams[]
        return writeStyle(writeStylePrams)
    })

    ipcMain.handle(MainChannels.OPEN_TUNNEL, (e: Electron.IpcMainInvokeEvent, args) => {
        const port = args as number
        return tunnelService.open(port)
    })

    ipcMain.handle(MainChannels.CLOSE_TUNNEL, (e: Electron.IpcMainInvokeEvent) => {
        return tunnelService.close()
    })
}
