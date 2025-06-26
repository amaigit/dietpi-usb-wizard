
import React, { useState, useCallback, ChangeEvent, FormEvent } from 'react';
import { ScriptConfig, AppStep } from './types';
import { generateScript } from './services/scriptBuilder';
import { ORIGINAL_GUIDE_TEXT } from './constants';
import StepIndicator from './components/StepIndicator';

const initialConfig: ScriptConfig = {
  dietPiImageUrl: 'https://dietpi.com/downloads/images/DietPi_NativePC-BIOS-x86_64-Bookworm.img.xz', // Example URL
  usbDeviceName: 'sdb',
  hostname: 'dietpi',
  networkConfig: {
    type: 'ethernet',
    wifiSsid: '',
    wifiPassword: '',
  },
};

const TOTAL_STEPS = Object.keys(AppStep).length / 2; // Enum keys are duplicated (number/string)
const STEP_NAMES = [
  "Benvenuto",
  "URL Immagine",
  "Disco USB",
  "Configurazione",
  "Revisione Script"
];


const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.Welcome);
  const [config, setConfig] = useState<ScriptConfig>(initialConfig);
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleNext = useCallback(() => {
    setError(''); // Clear error on navigation
    if (currentStep === AppStep.ImageUrl && !config.dietPiImageUrl.match(/^https?:\/\/.*\.(img\.xz|img\.gz|img\.bz2|img)$/i)) {
      setError("L'URL dell'immagine DietPi sembra non valido o non punta a un file .img o archivio supportato (.img.xz, .img.gz, .img.bz2).");
      return;
    }
    if (currentStep === AppStep.UsbDevice && !config.usbDeviceName.match(/^[a-zA-Z0-9]+$/)) { // Allow numbers in device names e.g. nvme0n1
      setError("Il nome del dispositivo USB deve contenere solo lettere e numeri (es. sdb, sdc, nvme0n1). Non includere /dev/.");
      return;
    }
     if (currentStep === AppStep.SystemConfig && config.networkConfig.type === 'wifi') {
      if (!config.networkConfig.wifiSsid) {
        setError("L'SSID Wi-Fi è obbligatorio per la configurazione Wi-Fi.");
        return;
      }
      // Password can be empty for open networks, but usually required.
    }

    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, config]);

  const handlePrev = useCallback(() => {
    setError('');
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleConfigChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'networkType') {
      setConfig(prev => ({
        ...prev,
        networkConfig: { ...prev.networkConfig, type: value as 'ethernet' | 'wifi' }
      }));
    } else if (name === 'wifiSsid' || name === 'wifiPassword') {
      setConfig(prev => ({
        ...prev,
        networkConfig: { ...prev.networkConfig, [name]: value }
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  }, []);

  const handleSubmitConfiguration = useCallback(() => {
    setError('');
    if (currentStep === AppStep.SystemConfig && config.networkConfig.type === 'wifi') {
      if (!config.networkConfig.wifiSsid) {
        setError("L'SSID Wi-Fi è obbligatorio per la configurazione Wi-Fi.");
        return;
      }
    }
    const script = generateScript(config);
    setGeneratedScript(script);
    setCurrentStep(AppStep.ReviewScript);
  }, [config, currentStep]);

  const downloadScript = useCallback(() => {
    const blob = new Blob([generatedScript], { type: 'text/bash' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'create_dietpi_usb.sh';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generatedScript]);

  const downloadOriginalGuide = () => {
    const blob = new Blob([ORIGINAL_GUIDE_TEXT], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guida_dietpi_usb.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const startOver = () => {
    setConfig(initialConfig);
    setCurrentStep(AppStep.Welcome);
    setGeneratedScript('');
    setError('');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case AppStep.Welcome:
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Benvenuto nel DietPi USB Wizard!</h2>
            <p className="text-lg text-gray-600 mb-6">
              Questa applicazione ti guiderà passo dopo passo nella creazione di uno script bash personalizzato
              per installare DietPi su una chiavetta USB. Potrai comprendere ogni passaggio e personalizzare
              lo script tramite un'interfaccia grafica, per poi scaricare il file <code>.sh</code> finale.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Lo script generato è basato sulla guida per utenti Linux e automatizza molti passaggi manuali.
              Assicurati di capire i comandi che verranno eseguiti, specialmente quelli relativi alla formattazione del disco.
            </p>
            <div className="space-y-4 sm:space-y-0 sm:flex sm:justify-center sm:space-x-4">
                 <button
                    onClick={() => setCurrentStep(AppStep.ImageUrl)}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105"
                >
                    Inizia Configurazione
                </button>
                <button
                    onClick={downloadOriginalGuide}
                    className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out"
                >
                    Scarica Guida Originale (TXT)
                </button>
            </div>
          </div>
        );
      case AppStep.ImageUrl:
        return (
          <div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-4">Passaggio 1: URL Immagine DietPi</h3>
            <p className="text-gray-600 mb-4">
              Inserisci l'URL completo del file immagine DietPi (<code>.img.xz</code>, <code>.img.gz</code>, <code>.img.bz2</code>, o <code>.img</code>) che desideri scaricare.
              Puoi trovare le immagini ufficiali sulla <a href="https://dietpi.com/#download" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">pagina di download di DietPi</a>.
            </p>
            <label htmlFor="dietPiImageUrl" className="block text-sm font-medium text-gray-700 mb-1">URL Immagine DietPi:</label>
            <input
              type="url"
              id="dietPiImageUrl"
              name="dietPiImageUrl"
              value={config.dietPiImageUrl}
              onChange={handleConfigChange}
              placeholder="https://dietpi.com/downloads/images/..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        );
      case AppStep.UsbDevice:
        return (
          <div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-4">Passaggio 2: Dispositivo USB di Destinazione</h3>
            <p className="text-gray-600 mb-4">
              Identifica il nome del tuo dispositivo USB (es. <code>sdb</code>, <code>sdc</code>, <code>nvme0n1</code>). <strong>NON includere</strong> <code>/dev/</code>.
              Puoi usare il comando <code>lsblk</code> nel terminale Linux per identificare il dispositivo corretto.
            </p>
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md" role="alert">
              <p className="font-bold">ATTENZIONE CRITICA!</p>
              <p>
                Questo passaggio è il più delicato. Un errore nell'identificazione del dispositivo può portare alla
                <strong>cancellazione IRREVERSIBILE</strong> del tuo sistema operativo principale o di altri dati importanti.
                Procedi con la massima cautela e verifica tre volte il nome del dispositivo.
              </p>
            </div>
            <label htmlFor="usbDeviceName" className="block text-sm font-medium text-gray-700 mb-1">Nome Dispositivo USB (es. sdb):</label>
            <input
              type="text"
              id="usbDeviceName"
              name="usbDeviceName"
              value={config.usbDeviceName}
              onChange={handleConfigChange}
              placeholder="sdb"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        );
      case AppStep.SystemConfig:
        return (
          <div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-6">Passaggio 3: Configurazione del Sistema</h3>
            <div className="space-y-6">
              <div>
                <label htmlFor="hostname" className="block text-sm font-medium text-gray-700 mb-1">Hostname:</label>
                <input
                  type="text"
                  id="hostname"
                  name="hostname"
                  value={config.hostname}
                  onChange={handleConfigChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Il nome che il tuo dispositivo DietPi avrà sulla rete.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Configurazione di Rete:</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-50">
                    <input
                      type="radio"
                      name="networkType"
                      value="ethernet"
                      checked={config.networkConfig.type === 'ethernet'}
                      onChange={handleConfigChange}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <span>Ethernet</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-50">
                    <input
                      type="radio"
                      name="networkType"
                      value="wifi"
                      checked={config.networkConfig.type === 'wifi'}
                      onChange={handleConfigChange}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <span>Wi-Fi</span>
                  </label>
                </div>
              </div>

              {config.networkConfig.type === 'wifi' && (
                <div className="space-y-4 pl-6 border-l-2 border-blue-200 ml-2 py-4">
                  <div>
                    <label htmlFor="wifiSsid" className="block text-sm font-medium text-gray-700 mb-1">SSID Wi-Fi (Nome Rete):</label>
                    <input
                      type="text"
                      id="wifiSsid"
                      name="wifiSsid"
                      value={config.networkConfig.wifiSsid}
                      onChange={handleConfigChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="wifiPassword" className="block text-sm font-medium text-gray-700 mb-1">Password Wi-Fi:</label>
                    <input
                      type="password"
                      id="wifiPassword"
                      name="wifiPassword"
                      value={config.networkConfig.wifiPassword}
                      onChange={handleConfigChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                     <p className="text-xs text-gray-500 mt-1">Lascia vuoto se la rete Wi-Fi non ha password.</p>
                  </div>
                </div>
              )}
              <div className="text-sm text-gray-600 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p><span className="font-semibold">Impostazioni predefinite (nello script generato):</span></p>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li>Timezone: <code>Europe/Rome</code></li>
                    <li>Server SSH: OpenSSH abilitato</li>
                    <li>Messaggio di benvenuto personalizzato al primo avvio: Abilitato</li>
                </ul>
              </div>
            </div>
          </div>
        );
      case AppStep.ReviewScript:
        return (
          <div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-4">Passaggio 4: Revisiona e Scarica lo Script</h3>
            <p className="text-gray-600 mb-4">
              Controlla attentamente lo script generato qui sotto. Questo script eseguirà comandi per scaricare
              l'immagine, scrivere sulla chiavetta USB e configurare DietPi.
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 p-4 mb-4 rounded-md" role="alert">
              <p className="font-bold">Importante:</p>
              <p>
                Esegui questo script con privilegi di root (<code>sudo ./create_dietpi_usb.sh</code>) su un sistema Linux.
                Assicurati che tutte le dipendenze (<code>lsblk, wget, xz, dd, mktemp, sleep, umount, chmod, sed, cat, grep, ip, basename, sync</code>) siano installate.
              </p>
            </div>
            <div className="bg-gray-900 text-gray-200 p-4 rounded-lg shadow-inner max-h-96 overflow-y-auto mb-6 font-mono text-xs leading-relaxed">
              <pre><code>{generatedScript}</code></pre>
            </div>
            <button
              onClick={downloadScript}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>Scarica Script (.sh)</span>
            </button>
            <p className="text-sm text-gray-500 mt-6">
              Dopo aver scaricato lo script, rendilo eseguibile (<code>chmod +x create_dietpi_usb.sh</code>)
              e poi eseguilo con <code>sudo ./create_dietpi_usb.sh</code>.
            </p>
          </div>
        );
      default:
        return <p>Passaggio non riconosciuto.</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-10">
          <img src="https://picsum.photos/seed/dietpi-logo/128/128" alt="DietPi Logo Placeholder" className="w-28 h-28 mx-auto rounded-full shadow-lg mb-4 border-4 border-white"/>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400">
            DietPi USB Wizard
          </h1>
          <p className="mt-2 text-lg text-gray-700">Crea la tua chiavetta USB avviabile DietPi in pochi semplici passaggi.</p>
        </header>

        {currentStep !== AppStep.Welcome && (
           <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} stepNames={STEP_NAMES} />
        )}

        <main className="bg-white p-6 sm:p-10 rounded-xl shadow-2xl">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
              <strong className="font-bold">Errore: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <form onSubmit={(e: FormEvent) => e.preventDefault()}>
            <div className="mb-8 min-h-[250px] flex flex-col justify-center"> {/* Min height for content area */}
                {renderStepContent()}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
                <div>
                  {currentStep > AppStep.Welcome && (
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2.5 px-5 rounded-lg transition duration-150 ease-in-out shadow-sm hover:shadow-md"
                    >
                      Indietro
                    </button>
                  )}
                   {currentStep === AppStep.ReviewScript && (
                     <button
                        type="button"
                        onClick={startOver}
                        className="w-full sm:w-auto sm:ml-2 mt-2 sm:mt-0 bg-amber-500 hover:bg-amber-600 text-white font-medium py-2.5 px-5 rounded-lg transition duration-150 ease-in-out shadow-sm hover:shadow-md"
                    >
                        Ricomincia
                    </button>
                   )}
                </div>
                <div>
                  {currentStep < AppStep.SystemConfig && currentStep !== AppStep.Welcome && (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out transform hover:scale-105"
                    >
                      Avanti
                    </button>
                  )}
                  {currentStep === AppStep.SystemConfig && (
                    <button
                      type="button"
                      onClick={handleSubmitConfiguration}
                      className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out transform hover:scale-105"
                    >
                      Genera Script
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </main>
        <footer className="text-center mt-12 text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} DietPi USB Wizard. Creato con intelligenza e cura.</p>
            <p>Verifica sempre gli script generati prima dell'esecuzione, specialmente se modificano dischi.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;