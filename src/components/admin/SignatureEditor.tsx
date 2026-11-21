import { Eraser, Image as ImageIcon, PenTool, Type, Upload } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent } from 'react';
import { adminApi } from '../../lib/api';
import { prepareImageDataUrl } from '../../lib/imageUpload';
import type { InvoiceSignature, InvoiceSignatureType, MediaItem } from '../../types/cms';
import { MediaPickerModal } from './MediaPickerModal';

interface SignatureEditorProps {
  value: InvoiceSignature;
  media: MediaItem[];
  onMediaAdded: (item: MediaItem) => void;
  onChange: (next: InvoiceSignature) => void;
}

export function SignatureEditor({
  value,
  media,
  onMediaAdded,
  onChange,
}: SignatureEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    if (value.type !== 'drawn') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (value.imageUrl && value.imageUrl.startsWith('data:image/')) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = value.imageUrl;
    }
  }, [value.type]);

  const getCanvasPoint = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = getCanvasPoint(e);
    ctx.strokeStyle = '#141413';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
  };

  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const commitCanvasDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onChange({ ...value, type: 'drawn', imageUrl: dataUrl });
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    commitCanvasDrawing();
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onChange({ ...value, type: 'drawn', imageUrl: '' });
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const dataUrl = await prepareImageDataUrl(file);
      const res = await adminApi.uploadMedia({
        name: `signature-${file.name.replace(/\.[^.]+$/, '')}`,
        folder: 'site',
        dataUrl,
      });
      onMediaAdded(res.media);
      onChange({ ...value, type: 'image', imageUrl: res.media.url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erreur lors du téléversement.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const modes: Array<{ id: InvoiceSignatureType; label: string; icon: typeof PenTool }> = [
    { id: 'image', label: 'Par image / cachet', icon: ImageIcon },
    { id: 'drawn', label: 'Dessiner au tracé', icon: PenTool },
    { id: 'text', label: 'Signature texte', icon: Type },
    { id: 'none', label: 'Sans signature', icon: Eraser },
  ];

  return (
    <div className="border border-[#E3E3E6] rounded-xl p-4 space-y-4 bg-[#FAF9F6]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-[#141413]">Signature sur la facture</p>
        <div className="flex flex-wrap gap-1">
          {modes.map((m) => {
            const Icon = m.icon;
            const active = value.type === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onChange({ ...value, type: m.id })}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
                  active
                    ? 'bg-[#8F6B18] text-white'
                    : 'bg-white border border-[#E3E3E6] text-[#5C5A55] hover:text-[#141413]'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {value.type !== 'none' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-[#5C5A55] mb-1">
              Nom du signataire
            </label>
            <input
              type="text"
              value={value.signerName}
              onChange={(e) => onChange({ ...value, signerName: e.target.value })}
              placeholder="Ex : Direction DIVIN HORUS"
              className="w-full px-3 py-1.5 text-xs bg-white border border-[#D9D6CF] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#5C5A55] mb-1">
              Fonction / Mention
            </label>
            <input
              type="text"
              value={value.signerRole}
              onChange={(e) => onChange({ ...value, signerRole: e.target.value })}
              placeholder="Ex : Responsable Commandes"
              className="w-full px-3 py-1.5 text-xs bg-white border border-[#D9D6CF] rounded-lg"
            />
          </div>
        </div>
      )}

      {value.type === 'image' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#8F6B18] hover:bg-[#735613] text-white rounded-lg cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? 'Import en cours...' : 'Importer une image de signature'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="sr-only"
              />
            </label>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="px-3 py-2 text-xs font-medium bg-white border border-[#D9D6CF] rounded-lg hover:bg-[#F3F2EE]"
            >
              Choisir depuis la bibliothèque
            </button>
          </div>
          {uploadError && <p className="text-xs text-red-700">{uploadError}</p>}
          {value.imageUrl ? (
            <div className="bg-white border border-[#E3E3E6] rounded-lg p-3 flex items-center justify-between gap-3">
              <img
                src={value.imageUrl}
                alt="Aperçu signature"
                className="max-h-16 max-w-[220px] object-contain"
              />
              <button
                type="button"
                onClick={() => onChange({ ...value, imageUrl: '' })}
                className="text-xs text-red-700 hover:underline"
              >
                Retirer
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-[#6B6860]">
              Importez une image PNG/JPG de votre signature ou cachet officiel.
            </p>
          )}
        </div>
      )}

      {value.type === 'drawn' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[#5C5A55]">
            <span>Tracez votre signature ci-dessous à la souris ou au doigt :</span>
            <button
              type="button"
              onClick={handleClearCanvas}
              className="inline-flex items-center gap-1 font-medium text-[#141413] hover:underline"
            >
              <Eraser className="w-3 h-3" />
              <span>Effacer</span>
            </button>
          </div>
          <canvas
            ref={canvasRef}
            width={440}
            height={130}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full h-32 bg-white border border-[#D9D6CF] rounded-lg touch-none cursor-crosshair"
          />
        </div>
      )}

      {value.type === 'text' && (
        <div className="bg-white border border-[#E3E3E6] rounded-lg p-4 text-center">
          <p className="font-display italic text-2xl text-[#8F6B18]">
            {value.signerName || 'Signature'}
          </p>
          {value.signerRole && (
            <p className="text-[11px] text-[#5C5A55] mt-0.5">{value.signerRole}</p>
          )}
        </div>
      )}

      <MediaPickerModal
        open={pickerOpen}
        media={media}
        defaultFolder="site"
        onMediaAdded={onMediaAdded}
        onSelect={(url) => {
          onChange({ ...value, type: 'image', imageUrl: url });
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}
