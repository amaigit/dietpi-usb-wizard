
// Testo della guida originale per il download
export const ORIGINAL_GUIDE_TEXT = `
Creare una USB Avviabile DietPi da Linux

Questa guida approfondita è pensata per utenti Linux che desiderano creare un'installazione
di DietPi su una chiavetta USB partendo dalle immagini standard. Andremo oltre i semplici
comandi, esplorando le migliori pratiche per garantire la sicurezza dei dati, comprendere ogni
passaggio e ottenere un sistema ottimizzato, che utilizzi l'intero spazio del drive e sia pronto
per la rete e la containerizzazione con Docker o Podman.

Prerequisiti
• Una chiavetta USB di qualità: Si consiglia una capacità di almeno 16 GB e una
  connessione USB 3.0 (o superiore) per prestazioni accettabili. Ricorda: tutti i dati sul
  drive verranno distrutti.
• Un PC con una distribuzione Linux: Useremo strumenti standard da riga di comando.
• Connessione Internet: Necessaria per gli aggiornamenti al primo avvio.
• L'immagine DietPi appropriata: Visita la pagina di download ufficiale di DietPi. La
  scelta dell'immagine è fondamentale:
  Ο Per PC, NUC, server o macchine virtuali (x86_64): Scarica l'immagine Native PC.
  Ο Per Single-Board Computer (SBC): Scarica l'immagine specifica per il tuo
    modello (es. Raspberry Pi 4, ODROID-C4, etc.).

Passaggio 1: Identificazione e Preparazione del Drive USB (Passaggio CRITICO)
Questo è il momento più delicato. Un errore nell'identificazione del dispositivo può portare alla
cancellazione del tuo sistema operativo principale. Procedi con la massima cautela.
1. Apri un terminale.
2. Senza la chiavetta USB inserita, esegui il comando lsblk (list block devices) per avere
   una mappa dei tuoi dischi attuali.
   lsblk
   L'output mostrerà i tuoi dischi interni (es. sda, sdb, o nvme0n1 per gli SSD NVMe).
3. Adesso, inserisci la tua chiavetta USB e riesegui immediatamente lo stesso comando:
   lsblk
   Confronta i due output. Noterai un nuovo dispositivo. Quello è il tuo drive USB.
4. Prendi nota del nome del dispositivo radice (es. /dev/sdb), NON della partizione (es.
   /dev/sdb1).
5. Se il sistema ha montato automaticamente una o più partizioni della chiavetta, smontale
   per assicurarti che nessun processo stia accedendo al disco durante la scrittura.
   sudo umount /dev/sdb*

Passaggio 2: Scrittura dell'Immagine su USB
Puoi scegliere tra il metodo manuale, che ti dà il controllo totale, o lo script automatico, che è
più sicuro e veloce.
Metodo A: Manuale con dd (Controllo Totale)
Useremo dd, uno strumento a riga di comando potente ma "pericoloso". La sua sintassi non
perdona errori.
Approfondimento: dd (Disk Dump)
dd opera a basso livello, copiando dati byte per byte da un'origine (if) a una destinazione (of).
Questa sua potenza lo rende ideale per creare cloni esatti di dischi e scrivere immagini, ma
anche estremamente rischioso se l'output file è sbagliato.
1. Nel terminale, naviga fino alla cartella dove hai scaricato e decompresso il file .img di
   DietPi.
2. Esegui il comando dd: ATTENZIONE: PERICOLO DI PERDITA DATI
   Controlla l'argomento of= tre volte. Se specifichi il disco del tuo sistema invece della
   chiavetta USB, CANCELLERAI IL TUO SISTEMA OPERATIVO IN MODO IRREVERSIBILE.
   Procedi solo se sei assolutamente sicuro.
   sudo dd if=DietPi_NativePC-x86_64-Bookworm.img of=/dev/sdX bs=4M status=progress conv=fsync
   Ο if=...: Input File. Il percorso dell'immagine .img.
   Ο of=/dev/sdX: Output File. Il percorso del tuo dispositivo USB. Sostituisci sdX con
     la lettera corretta!
   Ο bs=4M: Block Size. Accelera il processo.
   Ο status=progress: Mostra l'avanzamento.
   Ο conv=fsync: Garantisce l'integrità della scrittura.

Metodo B: Automatico con Script Interattivo (Consigliato)
Per rendere il processo più sicuro e automatizzare la configurazione, ho creato uno script
bash. Lo script ti guiderà nella scelta del disco, scaricherà l'immagine, la scriverà in sicurezza
e pre-configurerà il sistema con le opzioni di base.
(Questa app genera uno script simile a quello descritto qui)
`;