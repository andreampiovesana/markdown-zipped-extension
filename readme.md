# Markdown Zipped (MDZ) - Estensione VSCodium

Un'estensione per gestire file `.mdz` - documenti Markdown compressi con media integrati.

## 🌟 Caratteristiche

- **File compressi**: I file `.mdz` contengono il markdown + media in un unico archivio ZIP
- **Struttura standardizzata**: 
  - `document.md` - Il contenuto markdown principale
  - `media/` - Cartella con immagini, video, audio e altri allegati
- **Editor integrato**: Editor split-view con preview in tempo reale
- **Gestione media**: Drag & drop e inserimento semplificato di file multimediali
- **Auto-save**: Salvataggio automatico ogni 30 secondi

## 📁 Struttura File MDZ

```
document.mdz (file ZIP)
├── document.md          # Contenuto markdown
└── media/               # Cartella media
    ├── image1.png
    ├── video.mp4
    └── audio.mp3
```

## 🚀 Installazione

### Opzione 1: Build dal sorgente

1. Clona il repository:
```bash
git clone <repo-url>
cd markdown-zipped-extension
```

2. Esegui il build script:
```bash
chmod +x build.sh
./build.sh
```

3. L'estensione verrà compilata e installata automaticamente

### Opzione 2: Installazione manuale

1. Scarica il file `.vsix`
2. In VSCodium: `Ctrl+Shift+P` > "Extensions: Install from VSIX"
3. Seleziona il file scaricato

## 📖 Utilizzo

### Creare un nuovo documento MDZ

1. **Dal menu contestuale**: Click destro su una cartella > "New MDZ Document"
2. **Da comando**: `Ctrl+Shift+P` > "MDZ: New MDZ Document"

### Modificare un documento esistente

1. Apri un file `.mdz` - si aprirà automaticamente l'editor MDZ
2. Scrivi markdown nel pannello sinistro
3. Vedi l'anteprima nel pannello destro

### Aggiungere media

1. Click su "📎 Aggiungi Media" nella toolbar
2. Seleziona i file da includere
3. I file vengono automaticamente copiati nella cartella `media/`
4. Click sui tag dei file per inserire automaticamente i riferimenti

### Inserire riferimenti media

L'estensione inserisce automaticamente i riferimenti corretti:

- **Immagini**: `media/image.png`
- **Video**: `media/video.mp4`
- **Audio**: `media/audio.mp3`
- **Altri file**: `media/document.pdf`

## ⌨️ Scorciatoie

- `Ctrl+S` - Salva documento
- `Ctrl+Shift+P` > "MDZ: Export as Markdown" - Esporta come .md semplice

## 🔧 Sviluppo

### Prerequisiti

- Node.js 16+
- npm
- VSCodium o VS Code

### Setup sviluppo

```bash
npm install
npm run compile
npm run watch  # Per sviluppo con hot-reload
```

### Testing

```bash
# Apri una nuova finestra di VSCodium per testing
code --extensionDevelopmentPath=. --new-window
```

### Struttura progetto

```
markdown-zipped-extension/
├── src/
│   └── extension.ts      # Logica principale
├── package.json          # Configurazione estensione
├── tsconfig.json         # Config TypeScript
├── build.sh             # Script di build
└── README.md            # Questa documentazione
```

## 🐛 Risoluzione problemi

### L'estensione non si attiva
- Verifica che il file abbia estensione `.mdz`
- Riavvia VSCodium dopo l'installazione

### Errori di salvataggio
- Controlla i permessi della cartella
- Verifica che il disco non sia pieno

### Media non visualizzati
- Controlla che i file siano nella cartella `media/`
- Verifica i percorsi nei riferimenti markdown

## 📝 Formato supportati

### Media supportati
- **Immagini**: PNG, JPG, JPEG, GIF, SVG
- **Video**: MP4, WebM
- **Audio**: MP3, WAV
- **Documenti**: PDF e altri formati come allegati

### Compatibilità Markdown
- Syntax standard CommonMark
- Supporto HTML inline per media complessi
- Collegamenti relativi automatici alla cartella `media/`

## 🤝 Contributi

I contributi sono benvenuti! 

1. Fork del repository
2. Crea un branch per la feature: `git checkout -b feature/nuova-funzionalita`
3. Commit: `git commit -am 'Aggiunge nuova funzionalità'`
4. Push: `git push origin feature/nuova-funzionalita`
5. Crea una Pull Request

## 📄 Licenza

MIT License - vedi file LICENSE per dettagli.

## 🎯 Roadmap

- [ ] Supporto per template personalizzati
- [ ] Export in formati multipli (PDF, HTML, DOCX)
- [ ] Sincronizzazione cloud
- [ ] Plugin per altri editor
- [ ] Supporto tabelle avanzate
- [ ] Integrazione con servizi di immagini

## 🆘 Supporto

- 🐛 **Bug report**: Apri un issue su GitHub
- 💡 **Feature request**: Usa le GitHub Discussions
- 📧 **Contatto**: [tuo-email@esempio.com]

---

*Sviluppato con ❤️ per la comunità VSCodium*
