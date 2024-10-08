export enum EditorAttributes {
    // DOM attributes
    ONLOOK_TOOLBAR = 'onlook-toolbar',
    ONLOOK_RECT_ID = 'onlook-rect',
    ONLOOK_STYLESHEET_ID = 'onlook-stylesheet',
    ONLOOK_STUB_ID = 'onlook-drag-stub',

    // Data attributes
    DATA_ONLOOK_ID = 'data-onlook-id',
    DATA_ONLOOK_IGNORE = 'data-onlook-ignore',
    DATA_ONLOOK_INSERTED = 'data-onlook-inserted',
    DATA_ONLOOK_TIMESTAMP = 'data-onlook-timestamp',
    DATA_ONLOOK_SAVED_STYLE = 'data-onlook-saved-style',
    DATA_ONLOOK_ORIGINAL_INDEX = 'data-onlook-original-index',
    DATA_ONLOOK_DRAGGING = 'data-onlook-dragging',
    DATA_ONLOOK_DRAG_DIRECTION = 'data-onlook-drag-direction',
    DATA_ONLOOK_DRAG_START_POSITION = 'data-onlook-drag-start-position',
    DATA_ONLOOK_NEW_INDEX = 'data-onlook-new-index',
    DATA_ONLOOK_UNIQUE_ID = 'data-onlook-unique-id',
    DATA_ONLOOK_EDITING_TEXT = 'data-onlook-editing-text',
    DATA_ONLOOK_ORIGINAL_CONTENT = 'data-onlook-original-content',
}

export enum WebviewChannels {
    // To Webview
    UPDATE_STYLE = 'update-style',
    INSERT_ELEMENT = 'insert-element',
    REMOVE_ELEMENT = 'remove-element',
    MOVE_ELEMENT = 'move-element',
    EDIT_ELEMENT_TEXT = 'edit-element-text',
    CLEAN_AFTER_WRITE_TO_CODE = 'clean-after-write',
    PASTE_ELEMENT = 'paste-element',

    // From Webview
    ELEMENT_INSERTED = 'element-inserted',
    ELEMENT_REMOVED = 'element-removed',
    ELEMENT_MOVED = 'element-moved',
    ELEMENT_TEXT_EDITED = 'element-text-edited',
    STYLE_UPDATED = 'style-updated',
    WINDOW_RESIZED = 'window-resized',
    WINDOW_MUTATED = 'window-mutated',
    DOM_READY = 'custom-dom-ready',
}

export enum MainChannels {
    OPEN_IN_EXPLORER = 'open-in-explorer',
    OPEN_EXTERNAL_WINDOW = 'open-external-window',
    QUIT_AND_INSTALL = 'quit-and-update-app',
    UPDATE_DOWNLOADED = 'update-downloaded',
    UPDATE_NOT_AVAILABLE = 'update-not-available',
    SAVE_IMAGE = 'save-image',
    GET_IMAGE = 'get-image',
    SEND_WINDOW_COMMAND = 'send-window-command',

    // Code
    GET_CODE_BLOCK = 'get-code-block',
    GET_CODE_BLOCKS = 'get-code-blocks',
    GET_CODE_DIFFS = 'get-code-diffs',
    WRITE_CODE_BLOCKS = 'write-code-blocks',
    VIEW_SOURCE_CODE = 'view-source-code',
    PICK_COMPONENTS_DIRECTORY = 'pick-directory',
    GET_COMPONENTS = 'get-components',

    // Analytics
    UPDATE_ANALYTICS_PREFERENCE = 'update-analytics-preference',
    SEND_ANALYTICS = 'send-analytics',

    // Ast
    GET_TEMPLATE_NODE_AST = 'get-template-node-ast',
    GET_TEMPLATE_NODE_CHILD = 'get-template-node-child',
    GET_TEMPLATE_NODE_CLASS = 'get-template-node-classes',

    // Auth
    USER_SIGNED_IN = 'user-signed-in',
    USER_SIGNED_OUT = 'user-signed-out',
    GET_USER_METADATA = 'get-user-metadata',
    SIGN_OUT = 'sign-out',

    // Storage
    GET_USER_SETTINGS = 'get-user-settings',
    GET_APP_STATE = 'get-app-state',
    GET_PROJECTS = 'get-projects',

    UPDATE_USER_SETTINGS = 'update-user-settings',
    UPDATE_APP_STATE = 'update-app-state',
    UPDATE_PROJECTS = 'update-projects',

    // Create
    CREATE_NEW_PROJECT = 'create-new-project',
    CREATE_NEW_PROJECT_CALLBACK = 'create-new-project-callback',
    VERIFY_PROJECT = 'verify-project',
    VERIFY_PROJECT_CALLBACK = 'verify-project-callback',
    SETUP_PROJECT = 'setup-project',
    SETUP_PROJECT_CALLBACK = 'setup-project-callback',
}

export enum Links {
    DISCORD = 'https://discord.gg/hERDfFZCsH',
    GITHUB = 'https://github.com/onlook-dev/onlook',
    USAGE_DOCS = 'https://github.com/onlook-dev/onlook/wiki/How-to-set-up-my-project%3F',
    WIKI = 'https://github.com/onlook-dev/onlook/wiki',
    OPEN_ISSUE = 'https://github.com/onlook-dev/onlook/issues/new/choose',
}

export const APP_NAME = 'Onlook';
export const APP_SCHEMA = 'onlook';

export const DefaultSettings = {
    SCALE: 0.6,
    POSITION: { x: 300, y: 50 },
    URL: 'http://localhost:3000/',
    FRAME_POSITION: { x: 0, y: 0 },
    FRAME_DIMENSION: { width: 1536, height: 960 },
};

export const DOM_IGNORE_TAGS = ['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT'];

export const INLINE_ONLY_CONTAINERS = new Set([
    'a',
    'abbr',
    'area',
    'audio',
    'b',
    'bdi',
    'bdo',
    'br',
    'button',
    'canvas',
    'cite',
    'code',
    'data',
    'datalist',
    'del',
    'dfn',
    'em',
    'embed',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'i',
    'iframe',
    'img',
    'input',
    'ins',
    'kbd',
    'label',
    'li',
    'map',
    'mark',
    'meter',
    'noscript',
    'object',
    'output',
    'p',
    'picture',
    'progress',
    'q',
    'ruby',
    's',
    'samp',
    'script',
    'select',
    'slot',
    'small',
    'span',
    'strong',
    'sub',
    'sup',
    'svg',
    'template',
    'textarea',
    'time',
    'u',
    'var',
    'video',
    'wbr',
]);
