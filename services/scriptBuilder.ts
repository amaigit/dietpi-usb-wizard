
import { ScriptConfig } from '../types';

const BASH_COLORS = `
# --- Colori per l'output ---
C_RED='\\033[0;31m'
C_GREEN='\\033[0;32m'
C_YELLOW='\\033[1;33m'
C_BLUE='\\033[0;34m'
C_NC='\\033[0m' # No Color
`;

const UTILITY_FUNCTIONS = `
# --- Funzioni di Utility ---
check_root() {
  if [ "$EUID" -ne 0 ]; then
    echo -e "\${C_RED}Errore: Questo script deve essere eseguito con privilegi di root (usa sudo).\${C_NC}"
    exit 1
  fi
}

check_dependencies() {
  local missing_deps=()
  # lsblk from util-linux, wget, xz from xz-utils, dd from coreutils, mktemp from coreutils
  # sleep from coreutils, umount from util-linux, chmod from coreutils, sed from sed (gnu-sed)
  # cat from coreutils, grep from grep, ip from iproute2, basename from coreutils, sync from coreutils
  for cmd in lsblk wget xz dd mktemp sleep umount chmod sed cat grep ip basename sync; do
    if ! command -v "\$cmd" &> /dev/null; then
      missing_deps+=("\$cmd")
    fi
  done
  if [ \${#missing_deps[@]} -ne 0 ]; then
    echo -e "\${C_YELLOW}Attenzione: Dipendenze mancanti: \${missing_deps[*]}.\${C_NC}"
    echo "Per favore, installale usando il gestore di pacchetti della tua distribuzione."
    echo "Esempio per Debian/Ubuntu: sudo apt install util-linux wget xz-utils coreutils gnu-sed grep iproute2"
    exit 1
  fi
}
`;

const SCRIPT_HEADER = `#!/bin/bash
# Script per la Creazione di una Chiavetta USB Avviabile con DietPi
# Generato da DietPi USB Wizard
#
# ATTENZIONE: QUESTO SCRIPT CANCELLERA' TUTTI I DATI SUL DISPOSITIVO USB SELEZIONATO!
# USALO A TUO RISCHIO E PERICOLO. VERIFICA TRE VOLTE IL NOME DEL DISPOSITIVO.
# ==============================================================================
`;

const getCustomFirstRunScriptContent = <T,>() : string => {
  // IMPORTANT: Escape backticks (\`) and dollar signs (\$) if they are part of the literal script content.
  // The content below is simple enough not to require complex escaping for this specific case.
  return `#!/bin/bash
echo
echo -e "\${C_BLUE}*********************************************************************\${C_NC}"
echo -e "\${C_BLUE}**                                                                 **\${C_NC}"
echo -e "\${C_BLUE}**   Benvenuto nella tua installazione DietPi!                     **\${C_NC}"
echo -e "\${C_BLUE}**                                                                 **\${C_NC}"
echo -e "\${C_BLUE}*********************************************************************\${C_NC}"
echo
echo "Il setup iniziale è quasi completo."
echo "Dopo il login, puoi lanciare 'dietpi-launcher' per gestire il sistema."
echo "Indirizzi IP attuali:"
ip -4 a | grep "inet"
echo
echo "Script creato da DietPi USB Wizard - Buona fortuna!"
echo
`;
};


export const generateScript = (config: ScriptConfig): string => {
  const rawCustomFirstRunContent = getCustomFirstRunScriptContent();
  
  // Content for BASH_COLORS to be directly embedded in the custom script
  // This is already a string of bash commands, e.g., C_RED='\\033[0;31m'
  const bashColorsContentForHereDoc = BASH_COLORS;

  // Process customFirstRunContent: remove #!/bin/bash header to avoid duplicate shebang
  const processedCustomFirstRunContentForHereDoc = rawCustomFirstRunContent.substring(rawCustomFirstRunContent.indexOf('echo'));


  // Ensure config values are sanitized if they could break the script structure,
  // though for these specific fields, it's generally okay.
  // Shell escaping might be needed for SSID/Password if they contain special characters.
  // For simplicity, we assume they are relatively simple here.
  const escapedWifiSsid = config.networkConfig.wifiSsid ? config.networkConfig.wifiSsid.replace(/[^\w\s\d-]/g, '') : '';
  const escapedWifiPassword = config.networkConfig.wifiPassword ? config.networkConfig.wifiPassword.replace(/'/g, "'\\''") : '';


  return `
${SCRIPT_HEADER}
${BASH_COLORS} 
${UTILITY_FUNCTIONS}

# --- Inizio Script ---
clear
check_root
check_dependencies

echo -e "\${C_BLUE}==============================================================================\${C_NC}"
echo -e "\${C_BLUE} Script di Creazione USB Avviabile DietPi (Generato da DietPi USB Wizard) \${C_NC}"
echo -e "\${C_BLUE}==============================================================================\${C_NC}"
echo -e "Il processo cancellerà \${C_RED}TUTTI I DATI\${C_NC} dal dispositivo selezionato.\\n"
echo "Questo script è stato generato con i seguenti parametri:"
echo -e "  - URL Immagine DietPi: \${C_GREEN}${config.dietPiImageUrl}\${C_NC}"
echo -e "  - Dispositivo USB Target: \${C_YELLOW}/dev/${config.usbDeviceName}\${C_NC}"
echo -e "  - Hostname: \${C_GREEN}${config.hostname}\${C_NC}"
echo -e "  - Configurazione Rete: \${C_GREEN}${config.networkConfig.type}\${C_NC}"
${config.networkConfig.type === 'wifi' ? `echo -e "    - SSID Wi-Fi: \${C_GREEN}${escapedWifiSsid}\${C_NC}"` : ''}
echo ""
echo -e "\${C_YELLOW}!!! ATTENZIONE !!!\${C_NC}"
echo -e "Questo script modificherà il dispositivo \${C_RED}/dev/${config.usbDeviceName}\${C_NC}."
echo -e "Assicurati che sia il dispositivo corretto. \${C_RED}I DATI SARANNO PERSI.\${C_NC}"
echo -e "\${C_YELLOW}PREMERE INVIO PER CONTINUARE o CTRL+C per annullare...\${C_NC}"
read -r

# --- Passaggio 1: Download e Decompressione dell'Immagine DietPi ---
echo -e "\\n\${C_YELLOW}--- Passaggio 1: Download e Decompressione dell'Immagine DietPi ---\${C_NC}"
IMAGE_URL="${config.dietPiImageUrl}"
# Extract filename from URL
IMAGE_XZ_NAME=$(basename "\$IMAGE_URL")
# Remove .xz extension to get .img name
IMAGE_IMG_NAME="\${IMAGE_XZ_NAME%.xz}" 

if [ -z "\$IMAGE_URL" ]; then
  echo -e "\${C_RED}URL immagine non specificato. Uscita.\${C_NC}"
  exit 1
fi

if [ ! -f "\$IMAGE_IMG_NAME" ]; then
  echo "Download dell'immagine \${C_GREEN}\$IMAGE_URL\${C_NC} in corso..."
  # Use wget with output document name to handle complex URLs
  wget --progress=bar:force:noscroll -c "\$IMAGE_URL" -O "\$IMAGE_XZ_NAME"
  if [ \$? -ne 0 ]; then
    echo -e "\${C_RED}Download fallito. Controlla l'URL (\${IMAGE_URL}) e la connessione.\${C_NC}"
    rm -f "\$IMAGE_XZ_NAME" # Clean up partial download
    exit 1
  fi

  echo "Decompressione dell'immagine \${C_GREEN}\$IMAGE_XZ_NAME\${C_NC} (potrebbe richiedere tempo)..."
  xz -d -v "\$IMAGE_XZ_NAME"
  if [ \$? -ne 0 ]; then
    echo -e "\${C_RED}Decompressione fallita. Verifica che il file scaricato sia un archivio .xz valido.\${C_NC}"
    rm -f "\$IMAGE_IMG_NAME" # Clean up partial decompress
    exit 1
  fi
  echo -e "\${C_GREEN}Immagine decompressa: \$IMAGE_IMG_NAME\${C_NC}"
else
  echo "Immagine '\$IMAGE_IMG_NAME' già presente. Salto download e decompressione."
fi
echo -e "\${C_GREEN}Immagine pronta: \$IMAGE_IMG_NAME\${C_NC}\\n"


# --- Passaggio 2: Preparazione del Dispositivo USB di Destinazione ---
echo -e "\${C_YELLOW}--- Passaggio 2: Preparazione del Dispositivo USB di Destinazione ---\${C_NC}"
TARGET_DEVICE_NAME="${config.usbDeviceName}"
TARGET_DEVICE="/dev/\${TARGET_DEVICE_NAME}"

echo "Dispositivi a blocchi collegati (verifica il tuo target \${C_GREEN}\$TARGET_DEVICE\${C_NC}):"
lsblk -d -o NAME,SIZE,TYPE,MODEL
echo ""

if ! lsblk "\$TARGET_DEVICE" > /dev/null 2>&1; then
  echo -e "\${C_RED}Errore: Il dispositivo \$TARGET_DEVICE non esiste. Verifica il nome.\${C_NC}"
  lsblk -d -o NAME,SIZE,TYPE,MODEL
  exit 1
fi

echo -e "\${C_RED}========================= AVVISO IMPORTANTE ==========================\${C_NC}"
echo -e "\${C_RED}Stai per CANCELLARE COMPLETAMENTE il dispositivo \${C_YELLOW}\$TARGET_DEVICE\${C_NC}.\${C_NC}"
echo -e "\${C_RED}TUTTI I DATI SU \${C_YELLOW}\$TARGET_DEVICE\${C_NC} VERRANNO PERSI IN MODO IRREVERSIBILE.\${C_NC}"
echo -e "\${C_RED}Assicurati che \${C_YELLOW}\$TARGET_DEVICE\${C_NC} sia la CHIAVETTA USB corretta e non un disco di sistema.\${C_NC}"
echo -e "\${C_RED}======================================================================\${C_NC}"
read -r -p "Sei ASSOLUTAMENTE sicuro? Digita 'SI' (in maiuscolo) per procedere: " CONFIRMATION

if [ "\$CONFIRMATION" != "SI" ]; then
  echo "Operazione annullata dall'utente."
  exit 0
fi


# --- Passaggio 3: Scrittura dell'Immagine sul Dispositivo USB ---
echo -e "\\n\${C_YELLOW}--- Passaggio 3: Scrittura dell'Immagine sul Dispositivo USB ---\${C_NC}"
echo "Smonto tutte le partizioni di \$TARGET_DEVICE..."
# Unmount all partitions associated with the target device
for part in \$(lsblk -lnpo NAME "\$TARGET_DEVICE" | grep "\$TARGET_DEVICE"); do
    if mountpoint -q "\$part"; then
        echo "Smontaggio di \$part..."
        umount "\$part" || echo -e "\${C_YELLOW}Attenzione: impossibile smontare \$part, potrebbe essere in uso.\${C_NC}"
    fi
done
# An older, simpler way, might not catch all nested mounts:
# umount "\${TARGET_DEVICE}"* > /dev/null 2>&1 || true

echo "Scrittura di \${C_GREEN}\$IMAGE_IMG_NAME\${C_NC} su \${C_GREEN}\$TARGET_DEVICE\${C_NC} in corso..."
echo "(dd può sembrare bloccato, attendi il completamento. Questo potrebbe richiedere molto tempo.)"
dd if="\$IMAGE_IMG_NAME" of="\$TARGET_DEVICE" bs=4M status=progress conv=fsync
if [ \$? -ne 0 ]; then
  echo -e "\${C_RED}Errore durante la scrittura dell'immagine con dd.\${C_NC}"
  exit 1
fi
echo -e "\${C_GREEN}Scrittura dell'immagine completata con successo!\${C_NC}\\n"
echo "Sincronizzazione dei dati su disco..."
sync # Ensure all data is written


# --- Passaggio 4: Configurazione Pre-Avvio ---
echo -e "\${C_YELLOW}--- Passaggio 4: Configurazione Pre-Avvio ---\${C_NC}"
MOUNT_POINT=\$(mktemp -d dietpi_mount.XXXXXX) # Create a temporary directory in the current path
if [ -z "\$MOUNT_POINT" ] || [ ! -d "\$MOUNT_POINT" ]; then
    echo -e "\${C_RED}Errore: Impossibile creare directory di mount temporanea.\${C_NC}"
    exit 1
fi
echo "Directory di mount temporanea creata: \${C_GREEN}\$MOUNT_POINT\${C_NC}"


echo "Attendo che il kernel riconosca le nuove partizioni su \$TARGET_DEVICE..."
sleep 10 # Increased sleep time for kernel to recognize partitions

# Identifica la partizione di boot (solitamente la prima)
# lsblk -lnpo NAME /dev/sdx -> lists all partitions of /dev/sdx
# sed -n '2p' -> gets the second line, which is typically the first partition (e.g., /dev/sdx1)
# The first line is the device itself (e.g. /dev/sdx)
BOOT_PARTITION=\$(lsblk -lnpo NAME "\$TARGET_DEVICE" | sed -n '2p')

if [ -z "\$BOOT_PARTITION" ] || ! [ -b "\$BOOT_PARTITION" ]; then
    echo -e "\${C_RED}Impossibile identificare automaticamente la partizione di boot su \$TARGET_DEVICE.\${C_NC}"
    echo "Output di lsblk per \$TARGET_DEVICE:"
    lsblk "\$TARGET_DEVICE"
    echo "Prova a specificare manualmente la partizione di boot se necessario."
    rm -rf "\$MOUNT_POINT" # Clean up mount point
    exit 1
fi
echo "Partizione di boot identificata come: \${C_GREEN}\$BOOT_PARTITION\${C_NC}"


echo "Tentativo di montare \${C_GREEN}\$BOOT_PARTITION\${C_NC} su \${C_GREEN}\$MOUNT_POINT\${C_NC}..."
if ! mount "\$BOOT_PARTITION" "\$MOUNT_POINT"; then
  echo -e "\${C_RED}Impossibile montare la partizione di boot \$BOOT_PARTITION. Uscita.\${C_NC}"
  lsblk "\$TARGET_DEVICE"
  rm -rf "\$MOUNT_POINT" # Clean up mount point
  exit 1
fi
echo "Partizione di boot montata su \$MOUNT_POINT"

DIETPI_CONF="\$MOUNT_POINT/dietpi.txt"
DIETPI_WIFI_CONF="\$MOUNT_POINT/dietpi-wifi.txt" # This is the correct path for dietpi-wifi.txt

if [ ! -f "\$DIETPI_CONF" ]; then
    echo -e "\${C_RED}File di configurazione dietpi.txt non trovato in \$MOUNT_POINT. Potrebbe esserci un problema con l'immagine o il mount.\${C_NC}"
    umount "\$MOUNT_POINT"
    rm -rf "\$MOUNT_POINT"
    exit 1
fi
echo "File di configurazione dietpi.txt trovato."

echo "Configurazione di base..."
# Hostname
sed -i "s/^AUTO_SETUP_HOSTNAME=.*/AUTO_SETUP_HOSTNAME=${config.hostname}/" "\$DIETPI_CONF"
echo "Hostname impostato a: \${C_GREEN}${config.hostname}\${C_NC}"

# Timezone (default Europe/Rome come da script originale)
sed -i "s/^AUTO_SETUP_TIMEZONE=.*/AUTO_SETUP_TIMEZONE=Europe\\/Rome/" "\$DIETPI_CONF"
echo "Timezone impostata a: \${C_GREEN}Europe/Rome\${C_NC}"

# SSH Server (Abilita OpenSSH, index 2)
sed -i "s/^AUTO_SETUP_SSH_SERVER_INDEX=.*/AUTO_SETUP_SSH_SERVER_INDEX=2/" "\$DIETPI_CONF"
echo "Server SSH (OpenSSH) abilitato."

# Configurazione Rete
${
  config.networkConfig.type === 'wifi'
    ? `
echo "Configurazione Wi-Fi..."
sed -i "s/^AUTO_SETUP_NET_ETHERNET_ENABLED=.*/AUTO_SETUP_NET_ETHERNET_ENABLED=0/" "\$DIETPI_CONF"
sed -i "s/^AUTO_SETUP_NET_WIFI_ENABLED=.*/AUTO_SETUP_NET_WIFI_ENABLED=1/" "\$DIETPI_CONF"

# Ensure dietpi-wifi.txt exists, create if not (some images might not have it by default)
if [ ! -f "\$DIETPI_WIFI_CONF" ]; then
    echo -e "\${C_YELLOW}File dietpi-wifi.txt non trovato, lo creo...\${C_NC}"
    touch "\$DIETPI_WIFI_CONF"
    # Add default keys if missing, to prevent sed errors
    grep -q "^aWIFI_SSID\\[0\\]=" "\$DIETPI_WIFI_CONF" || echo "aWIFI_SSID[0]=" >> "\$DIETPI_WIFI_CONF"
    grep -q "^aWIFI_KEY\\[0\\]=" "\$DIETPI_WIFI_CONF" || echo "aWIFI_KEY[0]=" >> "\$DIETPI_WIFI_CONF"
fi

sed -i "s/^aWIFI_SSID\\[0\\]=.*/aWIFI_SSID[0]=${escapedWifiSsid}/" "\$DIETPI_WIFI_CONF"
sed -i "s/^aWIFI_KEY\\[0\\]=.*/aWIFI_KEY[0]='${escapedWifiPassword}'/" "\$DIETPI_WIFI_CONF" # Quote password
echo "Wi-Fi configurato per SSID: \${C_GREEN}${escapedWifiSsid}\${C_NC}"
`
    : `
echo "Configurazione Ethernet..."
sed -i "s/^AUTO_SETUP_NET_ETHERNET_ENABLED=.*/AUTO_SETUP_NET_ETHERNET_ENABLED=1/" "\$DIETPI_CONF"
sed -i "s/^AUTO_SETUP_NET_WIFI_ENABLED=.*/AUTO_SETUP_NET_WIFI_ENABLED=0/" "\$DIETPI_CONF"
echo "Ethernet configurato."
`
}

# Messaggio di benvenuto personalizzato
echo "Aggiungo uno script per il messaggio di benvenuto al primo avvio..."
# Path as seen by DietPi system when it runs (inside the /boot partition)
CUSTOM_SCRIPT_SYSTEM_PATH="/boot/custom_firstrun_script.sh" 
# Path where we write the script, relative to our $MOUNT_POINT
CUSTOM_SCRIPT_MOUNT_PATH="\$MOUNT_POINT/custom_firstrun_script.sh" 

# Write the script content to the mounted path using cat and a HERE document
# The 'END_OF_CUSTOM_SCRIPT' marker is quoted to prevent expansion of $ and \` within the HERE document by the main script's shell.
# JavaScript variables ${bashColorsContentForHereDoc} and ${processedCustomFirstRunContentForHereDoc} ARE expanded by JavaScript here.
cat << 'END_OF_CUSTOM_SCRIPT' > "\$CUSTOM_SCRIPT_MOUNT_PATH"
#!/bin/bash
${bashColorsContentForHereDoc}
${processedCustomFirstRunContentForHereDoc}
END_OF_CUSTOM_SCRIPT

# Rendo lo script eseguibile
chmod +x "\$CUSTOM_SCRIPT_MOUNT_PATH"
# Configuro dietpi.txt per eseguirlo
# Assicuro che il percorso in dietpi.txt sia quello che il sistema userà al boot
sed -i "s|^AUTO_SETUP_CUSTOM_SCRIPT_EXEC=.*|AUTO_SETUP_CUSTOM_SCRIPT_EXEC=\${CUSTOM_SCRIPT_SYSTEM_PATH}|" "\$DIETPI_CONF"
echo "Script di benvenuto personalizzato configurato per essere eseguito da: \${C_GREEN}\${CUSTOM_SCRIPT_SYSTEM_PATH}\${C_NC}"


echo "Smonto la partizione..."
sync # Assicuro che tutte le modifiche siano scritte su disco prima di smontare
umount "\$MOUNT_POINT"
if [ \$? -ne 0 ]; then
    echo -e "\${C_YELLOW}Attenzione: Impossibile smontare \$MOUNT_POINT. Potrebbe essere necessario farlo manualmente.\${C_NC}"
fi
rm -rf "\$MOUNT_POINT" # Pulisco la directory temporanea
echo "Configurazione Pre-Avvio completata."


# --- Fine ---
echo -e "\\n\${C_GREEN}====================== PROCESSO COMPLETATO! ======================\${C_NC}"
echo -e "\${C_GREEN}La tua chiavetta USB DietPi (\${C_YELLOW}\$TARGET_DEVICE\${C_NC}) è pronta.\${C_NC}"
echo "Puoi ora rimuoverla in sicurezza (dopo aver verificato che non ci siano più attività sul LED della chiavetta)"
echo "e usarla nel dispositivo di destinazione."
echo "Al primo avvio, DietPi completerà l'installazione e applicherà le configurazioni."
echo "Verrà eseguito anche lo script di benvenuto personalizzato."
echo -e "\${C_GREEN}Buona fortuna con DietPi!\${C_NC}"

exit 0
`;
};
