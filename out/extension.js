"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const yauzl = __importStar(require("yauzl"));
const yazl = __importStar(require("yazl"));
function activate(context) {
    console.log('MDZ Extension: Attivazione...');
    // Registra il custom editor per i file .mdz
    const provider = new MdzEditorProvider(context);
    const disposable = vscode.window.registerCustomEditorProvider('mdzEditor.editor', provider, {
        webviewOptions: {
            retainContextWhenHidden: true
        },
        supportsMultipleEditorsPerDocument: false
    });
    // Comando per creare nuovo file MDZ
    const createNewCommand = vscode.commands.registerCommand('mdzEditor.createNew', async (uri) => {
        const folderPath = uri.fsPath;
        const fileName = await vscode.window.showInputBox({
            prompt: 'Nome del file MDZ (senza estensione)',
            placeHolder: 'document'
        });
        if (fileName) {
            const mdzPath = path.join(folderPath, `${fileName}.mdz`);
            await createEmptyMdzFile(mdzPath, fileName);
            // Apri con il nostro custom editor
            const document = vscode.Uri.file(mdzPath);
            await vscode.commands.executeCommand('vscode.openWith', document, 'mdzEditor.editor');
        }
    });
    // Comando per aprire con MDZ editor
    const openWithCommand = vscode.commands.registerCommand('mdzEditor.openWith', async (uri) => {
        if (uri && uri.fsPath.endsWith('.mdz')) {
            await vscode.commands.executeCommand('vscode.openWith', uri, 'mdzEditor.editor');
        }
        else {
            vscode.window.showErrorMessage('Seleziona un file .mdz per aprirlo con MDZ Editor');
        }
    });
    // Comando per esportare come markdown
    const exportCommand = vscode.commands.registerCommand('mdzEditor.exportMd', async () => {
        vscode.window.showInformationMessage('Export funzionalità in sviluppo');
    });
    context.subscriptions.push(disposable, createNewCommand, openWithCommand, exportCommand);
    console.log('MDZ Extension: Attivata con successo!');
}
exports.activate = activate;
class MdzDocument {
    constructor(uri) {
        this.uri = uri;
    }
    dispose() {
        // Cleanup resources if needed
    }
}
class MdzEditorProvider {
    constructor(context) {
        this.context = context;
    }
    async openCustomDocument(uri, openContext, token) {
        return new MdzDocument(uri);
    }
    async resolveCustomEditor(document, webviewPanel, token) {
        console.log('MDZ Editor: Risoluzione custom editor per', document.uri.fsPath);
        webviewPanel.webview.options = {
            enableScripts: true,
        };
        try {
            // Estrai il contenuto MDZ
            const mdzContent = await this.extractMdzContent(document.uri);
            // Configura la webview
            webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, mdzContent);
            console.log('MDZ Editor: Webview configurata con successo');
            // Gestisci i messaggi dalla webview
            webviewPanel.webview.onDidReceiveMessage(async (message) => {
                try {
                    switch (message.type) {
                        case 'save':
                            await this.saveMdzFile(document.uri, message.content, message.mediaFiles);
                            break;
                        case 'addMedia':
                            await this.handleAddMedia(document.uri, webviewPanel);
                            break;
                    }
                }
                catch (error) {
                    console.error('Errore nel messaggio webview:', error);
                    vscode.window.showErrorMessage(`Errore: ${error}`);
                }
            });
            // Note: CustomReadonlyEditorProvider doesn't need document change listeners
        }
        catch (error) {
            console.error('Errore nella risoluzione del custom editor:', error);
            vscode.window.showErrorMessage(`Impossibile aprire il file MDZ: ${error}`);
            // Mostra una webview di errore
            webviewPanel.webview.html = this.getErrorHtml(`Errore nel caricamento del file: ${error}`);
        }
    }
    async extractMdzContent(uri) {
        try {
            const baseName = path.basename(uri.fsPath, '.mdz');
            return new Promise((resolve, reject) => {
                yauzl.open(uri.fsPath, { lazyEntries: true }, (err, zipfile) => {
                    if (err) {
                        resolve({ markdown: '# Nuovo Documento\n\nInizia a scrivere qui...', mediaFiles: [] });
                        return;
                    }
                    let markdown = '';
                    const mediaFiles = [];
                    let entriesProcessed = 0;
                    let totalEntries = 0;
                    zipfile.readEntry();
                    zipfile.on('entry', (entry) => {
                        totalEntries++;
                        if (/\/$/.test(entry.fileName)) {
                            // Directory entry
                            entriesProcessed++;
                            zipfile.readEntry();
                        }
                        else {
                            // File entry
                            zipfile.openReadStream(entry, (err, readStream) => {
                                if (err) {
                                    entriesProcessed++;
                                    zipfile.readEntry();
                                    return;
                                }
                                const chunks = [];
                                readStream.on('data', (chunk) => {
                                    chunks.push(chunk);
                                });
                                readStream.on('end', () => {
                                    const data = Buffer.concat(chunks);
                                    if (entry.fileName === `${baseName}.md`) {
                                        markdown = data.toString('utf8');
                                    }
                                    else if (entry.fileName.startsWith('media/')) {
                                        const fileName = entry.fileName.replace('media/', '');
                                        mediaFiles.push({
                                            name: fileName,
                                            path: entry.fileName,
                                            data: data
                                        });
                                    }
                                    entriesProcessed++;
                                    if (entriesProcessed === totalEntries) {
                                        resolve({
                                            markdown: markdown || '# Nuovo Documento\n\nInizia a scrivere qui...',
                                            mediaFiles
                                        });
                                    }
                                    else {
                                        zipfile.readEntry();
                                    }
                                });
                            });
                        }
                    });
                    zipfile.on('end', () => {
                        if (totalEntries === 0) {
                            resolve({ markdown: '# Nuovo Documento\n\nInizia a scrivere qui...', mediaFiles: [] });
                        }
                    });
                });
            });
        }
        catch (error) {
            console.error('Errore nell\'estrazione del file MDZ:', error);
            return { markdown: '# Errore\n\nImpossibile caricare il file MDZ.', mediaFiles: [] };
        }
    }
    async saveMdzFile(uri, markdownContent, mediaFiles) {
        return new Promise((resolve, reject) => {
            const baseName = path.basename(uri.fsPath, '.mdz');
            const zipfile = new yazl.ZipFile();
            // Aggiungi il file markdown
            zipfile.addBuffer(Buffer.from(markdownContent, 'utf8'), `${baseName}.md`);
            // Aggiungi i file media
            for (const mediaFile of mediaFiles) {
                if (mediaFile.data) {
                    zipfile.addBuffer(mediaFile.data, `media/${mediaFile.name}`);
                }
            }
            zipfile.outputStream.pipe(fs.createWriteStream(uri.fsPath))
                .on('close', () => {
                vscode.window.showInformationMessage('File MDZ salvato con successo!');
                resolve();
            })
                .on('error', (err) => {
                vscode.window.showErrorMessage(`Errore nel salvataggio: ${err.message}`);
                reject(err);
            });
            zipfile.end();
        });
    }
    async handleAddMedia(uri, webviewPanel) {
        const files = await vscode.window.showOpenDialog({
            canSelectMany: true,
            filters: {
                'Media': ['png', 'jpg', 'jpeg', 'gif', 'svg', 'mp4', 'webm', 'mp3', 'wav', 'pdf']
            }
        });
        if (files) {
            const mediaFiles = [];
            for (const file of files) {
                const fileName = path.basename(file.fsPath);
                const data = fs.readFileSync(file.fsPath);
                mediaFiles.push({
                    name: fileName,
                    path: `media/${fileName}`,
                    data: data
                });
            }
            webviewPanel.webview.postMessage({
                type: 'mediaAdded',
                files: mediaFiles
            });
        }
    }
    getErrorHtml(errorMessage) {
        return `<!DOCTYPE html>
        <html lang="it">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Errore MDZ</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 40px;
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    text-align: center;
                }
                .error-container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 40px;
                    border: 2px solid var(--vscode-errorBorder);
                    border-radius: 8px;
                    background-color: var(--vscode-inputValidation-errorBackground);
                }
                .error-icon {
                    font-size: 48px;
                    margin-bottom: 20px;
                }
                .error-title {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 16px;
                    color: var(--vscode-errorForeground);
                }
                .error-message {
                    font-size: 16px;
                    margin-bottom: 24px;
                    line-height: 1.5;
                }
                .help-text {
                    font-size: 14px;
                    opacity: 0.8;
                }
            </style>
        </head>
        <body>
            <div class="error-container">
                <div class="error-icon">⚠️</div>
                <div class="error-title">Impossibile aprire il file MDZ</div>
                <div class="error-message">${errorMessage}</div>
                <div class="help-text">
                    Verifica che il file sia un archivo MDZ valido.<br>
                    Prova a creare un nuovo documento MDZ dal menu contestuale.
                </div>
            </div>
        </body>
        </html>`;
    }
    getHtmlForWebview(webview, content) {
        return `<!DOCTYPE html>
        <html lang="it">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>MDZ Editor</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                }
                .editor-container {
                    display: flex;
                    height: calc(100vh - 80px);
                    gap: 20px;
                }
                .editor-panel {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .preview-panel {
                    flex: 1;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    overflow: auto;
                    padding: 20px;
                    background-color: var(--vscode-editor-background);
                }
                #markdown-editor {
                    flex: 1;
                    font-family: 'Courier New', monospace;
                    font-size: 14px;
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    padding: 10px;
                    resize: none;
                    outline: none;
                }
                .toolbar {
                    margin-bottom: 10px;
                    padding: 10px;
                    background-color: var(--vscode-panel-background);
                    border-radius: 4px;
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }
                button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .media-section {
                    margin-top: 20px;
                    padding: 10px;
                    background-color: var(--vscode-panel-background);
                    border-radius: 4px;
                }
                .media-files {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-top: 10px;
                }
                .media-item {
                    padding: 5px 10px;
                    background-color: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    border-radius: 12px;
                    font-size: 12px;
                    cursor: pointer;
                }
                .preview-content img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 4px;
                }
            </style>
        </head>
        <body>
            <div class="toolbar">
                <button onclick="saveDocument()">💾 Salva</button>
                <button onclick="addMedia()">📎 Aggiungi Media</button>
                <button onclick="insertImage()">🖼️ Inserisci Immagine</button>
                <span style="margin-left: auto; font-size: 12px; opacity: 0.7;">
                    File: ${content.mediaFiles.length} allegati
                </span>
            </div>
            
            <div class="editor-container">
                <div class="editor-panel">
                    <textarea id="markdown-editor" placeholder="Scrivi il tuo markdown qui...">${content.markdown}</textarea>
                    
                    <div class="media-section">
                        <strong>File Media:</strong>
                        <div class="media-files" id="media-files">
                            ${content.mediaFiles.map(file => `<span class="media-item" onclick="insertMediaReference('${file.name}')">${file.name}</span>`).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="preview-panel">
                    <div id="preview-content" class="preview-content">
                        <!-- Preview del markdown renderizzato -->
                    </div>
                </div>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                const editor = document.getElementById('markdown-editor');
                const preview = document.getElementById('preview-content');
                let mediaFiles = ${JSON.stringify(content.mediaFiles)};
                
                // Aggiorna preview in tempo reale
                editor.addEventListener('input', updatePreview);
                updatePreview();
                
                function updatePreview() {
                    const markdown = editor.value;
                    // Semplice rendering markdown (in produzione usare una libreria come marked.js)
                    let html = markdown
                        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                        .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
                        .replace(/\\*(.*?)\\*/g, '<em>$1</em>')
                        .replace(/!\\[([^\\]]*)\\]\\(([^\\)]*)\\)/g, '<img alt="$1" src="$2" />')
                        .replace(/\\[([^\\]]*)\\]\\(([^\\)]*)\\)/g, '<a href="$2">$1</a>')
                        .replace(/\\n/g, '<br>');
                    
                    preview.innerHTML = html;
                }
                
                function saveDocument() {
                    vscode.postMessage({
                        type: 'save',
                        content: editor.value,
                        mediaFiles: mediaFiles
                    });
                }
                
                function addMedia() {
                    vscode.postMessage({
                        type: 'addMedia'
                    });
                }
                
                function insertImage() {
                    const cursor = editor.selectionStart;
                    const text = '![Descrizione immagine](media/nome-file.jpg)';
                    editor.setRangeText(text, cursor, cursor);
                    editor.focus();
                    editor.setSelectionRange(cursor + text.length, cursor + text.length);
                    updatePreview();
                }
                
                function insertMediaReference(fileName) {
                    const cursor = editor.selectionStart;
                    const ext = fileName.split('.').pop().toLowerCase();
                    let text;
                    
                    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) {
                        text = \`![](media/\${fileName})\`;
                    } else if (['mp4', 'webm'].includes(ext)) {
                        text = \`<video controls src="media/\${fileName}"></video>\`;
                    } else if (['mp3', 'wav'].includes(ext)) {
                        text = \`<audio controls src="media/\${fileName}"></audio>\`;
                    } else {
                        text = \`[📁 \${fileName}](media/\${fileName})\`;
                    }
                    
                    editor.setRangeText(text, cursor, cursor);
                    editor.focus();
                    editor.setSelectionRange(cursor + text.length, cursor + text.length);
                    updatePreview();
                }
                
                // Gestisci messaggi dall'estensione
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.type) {
                        case 'mediaAdded':
                            mediaFiles = mediaFiles.concat(message.files);
                            updateMediaFiles();
                            break;
                    }
                });
                
                function updateMediaFiles() {
                    const mediaContainer = document.getElementById('media-files');
                    mediaContainer.innerHTML = mediaFiles.map(file => 
                        \`<span class="media-item" onclick="insertMediaReference('\${file.name}')">\${file.name}</span>\`
                    ).join('');
                }
                
                // Auto-save ogni 30 secondi
                setInterval(() => {
                    saveDocument();
                }, 30000);
            </script>
        </body>
        </html>`;
    }
}
async function createEmptyMdzFile(filePath, baseName) {
    return new Promise((resolve, reject) => {
        const zipfile = new yazl.ZipFile();
        // Aggiungi il file markdown di base
        zipfile.addBuffer(Buffer.from('# Nuovo Documento\n\nInizia a scrivere qui...', 'utf8'), `${baseName}.md`);
        // Crea una cartella media vuota (aggiungi un file nascosto per creare la directory)
        zipfile.addBuffer(Buffer.from(''), 'media/.gitkeep');
        zipfile.outputStream.pipe(fs.createWriteStream(filePath))
            .on('close', () => resolve())
            .on('error', (err) => reject(err));
        zipfile.end();
    });
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map