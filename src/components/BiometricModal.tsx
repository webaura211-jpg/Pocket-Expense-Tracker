import React, { useState, useEffect } from 'react';
import { Fingerprint, Lock, ShieldCheck, KeyRound, X, AlertCircle } from 'lucide-react';
import { audioAlert } from '../utils/audioAlert';

interface BiometricModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: () => void;
  correctPin: string;
}

export const BiometricModal: React.FC<BiometricModalProps> = ({
  isOpen,
  onClose,
  onUnlockSuccess,
  correctPin,
}) => {
  const [authMode, setAuthMode] = useState<'biometric' | 'pin'>('biometric');
  const [pinInput, setPinInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAuthMode('biometric');
      setPinInput('');
      setScanStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulateBiometricScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanStatus('idle');
    setErrorMessage('');

    // Simulate authentic biometric sensor latency
    setTimeout(() => {
      setIsScanning(false);
      setScanStatus('success');
      audioAlert.playConfirmChime();
      setTimeout(() => {
        onUnlockSuccess();
        onClose();
      }, 600);
    }, 1100);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === correctPin) {
      audioAlert.playConfirmChime();
      onUnlockSuccess();
      onClose();
    } else {
      setErrorMessage('Incorrect Security PIN. Hint: Default PIN is 1234');
      setPinInput('');
    }
  };

  const handleNumberClick = (digit: string) => {
    if (pinInput.length < 4) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      if (nextPin.length === 4) {
        if (nextPin === correctPin) {
          audioAlert.playConfirmChime();
          onUnlockSuccess();
          onClose();
        } else {
          setErrorMessage('Incorrect Security PIN. Hint: Default PIN is 1234');
          setPinInput('');
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors p-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">Private Ledger Access</h3>
          <p className="text-xs text-slate-400 mt-1">
            Authenticate to view confidential stipend allocations and audit ledger entries.
          </p>
        </div>

        {authMode === 'biometric' ? (
          <div className="flex flex-col items-center">
            {/* Biometric Scanner Visual */}
            <div
              onClick={handleSimulateBiometricScan}
              className={`relative cursor-pointer w-28 h-28 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                scanStatus === 'success'
                  ? 'border-emerald-500 bg-emerald-950/40 text-emerald-400 scale-105'
                  : isScanning
                  ? 'border-emerald-400 bg-emerald-950/20 text-emerald-400 animate-pulse'
                  : 'border-slate-700 hover:border-emerald-500/60 bg-slate-800/80 text-slate-300 hover:text-emerald-400'
              }`}
            >
              {isScanning && (
                <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-25" />
              )}
              {scanStatus === 'success' ? (
                <ShieldCheck className="w-14 h-14 text-emerald-400 animate-in zoom-in" />
              ) : (
                <Fingerprint className={`w-14 h-14 ${isScanning ? 'scale-110' : ''}`} />
              )}
            </div>

            <p className="text-xs text-slate-400 mt-4 font-medium">
              {isScanning
                ? 'Verifying Biometric Sensor...'
                : scanStatus === 'success'
                ? 'Verified. Unlocking Ledger...'
                : 'Touch Sensor or Click to Scan'}
            </p>

            <button
              type="button"
              onClick={handleSimulateBiometricScan}
              className="mt-4 w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors shadow-sm"
            >
              {isScanning ? 'Scanning...' : 'Simulate Touch ID / Face ID'}
            </button>

            <button
              type="button"
              onClick={() => setAuthMode('pin')}
              className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Use 4-Digit Security PIN instead
            </button>
          </div>
        ) : (
          <div>
            {/* PIN Entry Display */}
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="flex justify-center gap-3 my-4">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      pinInput.length > index
                        ? 'bg-emerald-500 border-emerald-500 scale-110'
                        : 'border-slate-600'
                    }`}
                  />
                ))}
              </div>

              {errorMessage && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 justify-center bg-rose-950/30 p-2 rounded border border-rose-900/50">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      if (item === 'C') {
                        setPinInput('');
                        setErrorMessage('');
                      } else if (item === '⌫') {
                        setPinInput((prev) => prev.slice(0, -1));
                      } else {
                        handleNumberClick(item);
                      }
                    }}
                    className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 transition-colors flex items-center justify-center active:scale-95"
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('biometric')}
                  className="text-xs text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 mx-auto"
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  Back to Biometric Sensor
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
