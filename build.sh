#!/bin/bash

# Script per build e installazione dell'estensione MDZ

# Colori per output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Build dell'estensione MDZ...${NC}"

# Controlla se Node.js è installato
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js non trovato. Installa Node.js prima di continuare.${NC}"
    exit 1
fi

# Controlla se npm è installato
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm non trovato. Installa npm prima di continuare.${NC}"
    exit 1
fi

# Crea file LICENSE se non esiste
if [ ! -f "LICENSE" ]; then
    echo -e "${BLUE}📄 Creazione file LICENSE...${NC}"
    cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2025 MDZ Extension Author

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
fi

# Installa vsce se non presente
if ! command -v vsce &> /dev/null; then
    echo -e "${BLUE}📦 Installazione di vsce...${NC}"
    npm install -g vsce
fi

# Installa le dipendenze
echo -e "${BLUE}📦 Installazione dipendenze...${NC}"
npm install

# Installa le dipendenze di tipo se mancanti
if [ ! -d "node_modules/@types/yauzl" ]; then
    echo -e "${BLUE}📦 Installazione tipi TypeScript aggiuntivi...${NC}"
    npm install --save-dev @types/yauzl @types/yazl
fi

# Compila TypeScript
echo -e "${BLUE}🔄 Compilazione TypeScript...${NC}"
npm run compile

# Verifica che la compilazione sia andata a buon fine
if [ ! -d "out" ]; then
    echo -e "${RED}❌ Errore nella compilazione. Cartella 'out' non trovata.${NC}"
    exit 1
fi

# Copia i file di configurazione necessari
if [ -f "language-configuration.json" ]; then
    cp language-configuration.json out/
fi

# Crea il package VSIX
echo -e "${BLUE}📦 Creazione package VSIX...${NC}"
vsce package

# Trova il file .vsix creato
VSIX_FILE=$(ls *.vsix 2>/dev/null | head -n1)

if [ -z "$VSIX_FILE" ]; then
    echo -e "${RED}❌ Errore: file VSIX non creato.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Estensione creata: $VSIX_FILE${NC}"

# Chiedi se installare l'estensione
read -p "Vuoi installare l'estensione in VSCodium? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Prova prima con codium, poi con code
    if command -v codium &> /dev/null; then
        echo -e "${BLUE}📥 Installazione in VSCodium...${NC}"
        codium --install-extension "$VSIX_FILE"
        echo -e "${GREEN}✅ Estensione installata in VSCodium!${NC}"
    elif command -v code &> /dev/null; then
        echo -e "${BLUE}📥 Installazione in VS Code...${NC}"
        code --install-extension "$VSIX_FILE"
        echo -e "${GREEN}✅ Estensione installata in VS Code!${NC}"
    else
        echo -e "${RED}❌ Né VSCodium né VS Code trovati.${NC}"
        echo -e "${BLUE}💡 Puoi installare manualmente il file: $VSIX_FILE${NC}"
    fi
fi

echo -e "${GREEN}🎉 Build completato!${NC}"
echo -e "${BLUE}📁 Per usare l'estensione:${NC}"
echo -e "   1. Apri VSCodium"
echo -e "   2. Crea un nuovo file .mdz o usa 'Ctrl+Shift+P' > 'New MDZ Document'"
echo -e "   3. Inizia a scrivere markdown!"

# Cleanup opzionale
read -p "Vuoi rimuovere il file VSIX dopo l'installazione? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm "$VSIX_FILE"
    echo -e "${GREEN}🗑️ File VSIX rimosso.${NC}"
fi