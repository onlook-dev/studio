import { setApi } from './api';
import { processDom } from './dom';
import { listenForEvents } from './events';

function handleBodyReady() {
    processDom();
    setApi();
    listenForEvents();

    // Refressh the DOM every 5 seconds
    setInterval(() => processDom(), 5000);
}

const handleDocumentBody = setInterval(() => {
    window.onerror = function logError(errorMsg, url, lineNumber) {
        console.log(`Unhandled error: ${errorMsg} ${url} ${lineNumber}`);
    };

    if (window?.document?.body) {
        clearInterval(handleDocumentBody);
        try {
            handleBodyReady();
        } catch (err) {
            console.log('Error in documentBodyInit:', err);
        }
    }
}, 300);
