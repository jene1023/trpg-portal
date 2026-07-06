"use client";

import { useEffect, useRef, useState } from "react";
import { QrCode, Download, X } from "lucide-react";
import QRCode from "qrcode";

type Props = {
  url: string;
  label?: string;
};

export default function QrCodeShare({ url, label }: Props) {
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (open && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 240,
        margin: 2,
        color: { dark: "#c9b45a", light: "#1a1610" },
      }).catch(() => {});
    }
  }, [open, url]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${label ?? "qrcode"}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
        title="QRコードを表示"
      >
        <QrCode size={14} />
        QR
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative rounded-xl border border-coc-border bg-coc-surface p-6 flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full">
              <h2 className="font-cinzel text-sm font-semibold text-coc-text">
                QRコード
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-coc-muted hover:text-coc-text transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <canvas ref={canvasRef} className="rounded-lg" />

            <p className="text-xs text-coc-muted break-all max-w-[240px] text-center select-all">
              {url}
            </p>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-lg border border-coc-gold-dim bg-coc-raised px-4 py-2 text-sm text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors"
            >
              <Download size={14} />
              PNGダウンロード
            </button>
          </div>
        </div>
      )}
    </>
  );
}
