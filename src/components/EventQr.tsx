"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function EventQr({ url }: { url: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border-2 border-brand-dark text-brand-dark py-3 font-semibold hover:bg-brand-dark hover:text-white transition"
      >
        Mostrar QR para que rellenen sus datos
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center space-y-4">
            <h3 className="font-semibold">Escanéame</h3>
            <div className="flex justify-center">
              <QRCodeSVG value={url} size={220} />
            </div>
            <p className="text-xs text-gray-500 break-all">{url}</p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm"
              >
                {copied ? "¡Copiado!" : "Copiar enlace"}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg bg-brand-dark text-white py-2 text-sm hover:bg-brand-dark-hover transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
