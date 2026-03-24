"use client";

import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { RotateCcw, Check } from 'lucide-react';

interface SignatureCaptureProps {
  onSave: (base64: string) => void;
  onClear: () => void;
  existingSignature?: string;
  label: string;
}

export default function SignatureCapture({ onSave, onClear, existingSignature, label }: SignatureCaptureProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);

  const clear = () => {
    sigCanvas.current?.clear();
    onClear();
  };

  const save = () => {
    if (sigCanvas.current?.isEmpty()) return;
    const base64 = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (base64) {
      onSave(base64);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
        {existingSignature ? (
          <div className="bg-white p-4 flex flex-col items-center">
            <img src={existingSignature} alt="Signature" className="max-h-32 object-contain" />
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={onClear}
              className="mt-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Clear Signature
            </Button>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="bg-white">
              <SignatureCanvas
                ref={sigCanvas}
                penColor="#1B3D6D"
                canvasProps={{
                  className: "signature-canvas w-full h-40 cursor-crosshair",
                }}
              />
            </div>
            <div className="flex justify-between p-2 border-t border-slate-200 bg-slate-50">
              <Button type="button" variant="ghost" size="sm" onClick={clear}>
                Clear
              </Button>
              <Button type="button" size="sm" onClick={save} className="bg-[#1B3D6D] text-white">
                <Check className="w-4 h-4 mr-2" /> Accept Signature
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
