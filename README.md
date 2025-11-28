# Meal & Play - App Asilo

## 📱 Progressive Web App (PWA)

Questa applicazione è una **PWA installabile** per visualizzare menu e attività dell'asilo! Gli utenti possono installarla sui loro dispositivi come una vera app.

### File PWA
- **manifest.json** - Configurazione PWA
- **sw.js** - Service worker per gestione cache e offline
- **icon-192.png / icon-512.png** - Icone dell'app

## Struttura del Progetto

- **index.html** - Pagina principale dell'applicazione
- **week-config.txt** - Configurazione data di inizio settimane
- **menu-nido.txt** - Menu per gruppo Piccoli (Nido)
- **menu-infanzia.txt** - Menu per gruppo Grandi (Infanzia)
- **activities.txt** - Attività per tutti i gruppi
- **README.md** - Questo file

## ⚙️ Configurazione Iniziale - IMPORTANTE

### Impostare la Data di Inizio

Prima di utilizzare l'applicazione, configura la data del lunedì della prima settimana:

1. Apri il file `week-config.txt`
2. Modifica la data nel formato `YYYY-MM-DD`

**Esempio:**
```
2025-10-20
```

⚠️ **Importante**: La data deve essere un **lunedì**. Questa data determina l'inizio del ciclo di 4 settimane.

### Come funziona il calcolo delle settimane

L'applicazione calcola automaticamente:
- Quale settimana (1-4) mostrare in base alla data odierna
- Le date effettive di ogni giorno della settimana
- Il giorno corrente e quello di domani
- Gestisce il weekend mostrando la prossima settimana

## Come Modificare i Dati ⭐

### Menu

**File da modificare:**
- `menu-nido.txt` - Menu per gruppo Piccoli
- `menu-infanzia.txt` - Menu per gruppo Grandi

**Formato:**
```
settimana|giorno|primo|secondo|frutta
```

**Esempio:**
```
1|1|Pasta al pomodoro|Pollo alla griglia|Mela
1|2|Risotto ai funghi|Bistecca di manzo|Pera
```

### Attività

**File da modificare:** `activities.txt`

**Formato:**
```
gruppo|giorno|attivita_mattino|attivita_pomeriggio
```

**Esempi:**
```
nido|1|Gioco libero|Letto|
primavera|1|Laboratorio creativo|Gioco all'aperto|
infanzia1|1|Musica|Sport|
infanzia2|1|-|Lettura|
```

**Gruppi disponibili:**
- `nido` - Nido
- `primavera` - Sezione Primavera
- `infanzia1` - Infanzia 1
- `infanzia2` - Infanzia 2

**Giorni:**
- `1` = Lunedì
- `2` = Martedì
- `3` = Mercoledì
- `4` = Giovedì
- `5` = Venerdì
- `6` = Sabato

**Valori speciali:**
- `-` = Nessuna attività per quel momento della giornata

## Funzionalità dell'Applicazione

### Sezioni Principali

1. **Preferiti** - Salva e visualizza combinazioni personalizzate di menu e attività
2. **Menu** - Visualizza menu settimanale per Piccoli/Grandi
3. **Attività** - Visualizza attività giornaliere suddivise per gruppo

### Visualizzazione Menu

- **Tipologia**: Seleziona tra "Piccoli" (Nido) e "Grandi" (Infanzia)
- **Giorno corrente**: Evidenziato con stile speciale
- **Struttura**: Primo, Secondo, Frutta per ogni giorno

### Visualizzazione Attività

- **Gruppi**: Nido, Primavera, Infanzia 1, Infanzia 2
- **Suddivisione**: Mattino 🌅 e Pomeriggio 🌇 separati
- **Giorno corrente**: Evidenziato con stile speciale

### Preferiti

Crea combinazioni personalizzate con:
- Nome personalizzato
- Scelta tipologia menu
- Scelta gruppo attività
- Visualizzazione rapida di oggi/domani

## Gestione Cache

L'applicazione è configurata per **non utilizzare cache**:
- Meta tag anti-cache nel HTML
- Cache-busting con timestamp nei caricamenti
- Service worker con strategia network-first per i dati

Questo garantisce che i dati siano sempre aggiornati.

## Note Tecniche

- **Responsive design**: Ottimizzato per mobile e desktop
- **PWA**: Installabile su dispositivi supportati
- **Offline**: Funzionalità base disponibili offline
- **Auto-aggiornamento**: I dati si aggiornano automaticamente al ricaricamento
- **LocalStorage**: I preferiti sono salvati localmente sul dispositivo

## Formati File Dettagliati

### Menu (menu-nido.txt / menu-infanzia.txt)
```
# Commenti iniziano con #
# Settimana 1
1|1|Pasta al pomodoro|Pollo alla griglia|Mela
1|2|Risotto ai funghi|Bistecca di manzo|Pera
```

### Attività (activities.txt)
```
# Attività Nido
nido|1|Gioco libero|Letto|
nido|2|Laboratorio creativo|Gioco all'aperto|

# Attività con solo pomeriggio
primavera|3|-|Lettura|
```

## Supporto

Per problemi o domande:
1. Verifica il formato dei file dati
2. Controlla la configurazione di `week-config.txt`
3. Ricarica la pagina per aggiornare i dati
