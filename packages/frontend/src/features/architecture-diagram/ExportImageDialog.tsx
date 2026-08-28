import { useState } from 'react';
import { Button } from '../../shared/components/Button';
import { Modal } from '../../shared/components/Modal';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExportImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  diagramName: string;
}

export function ExportImageDialog({ isOpen, onClose, diagramName }: ExportImageDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState<'png' | 'pdf'>('png');

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const canvas = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!canvas) {
        alert('Diagrama não encontrado');
        return;
      }

      const renderedCanvas = await html2canvas(canvas, {
        backgroundColor: '#0f172a',
        scale: 2,
      });

      if (format === 'png') {
        const link = document.createElement('a');
        link.href = renderedCanvas.toDataURL('image/png');
        link.download = `${diagramName || 'diagrama'}-${Date.now()}.png`;
        link.click();
      } else {
        const imgData = renderedCanvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: renderedCanvas.width > renderedCanvas.height ? 'l' : 'p',
          unit: 'mm',
          format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = renderedCanvas.width / renderedCanvas.height;

        let width = pdfWidth;
        let height = pdfWidth / ratio;

        if (height > pdfHeight) {
          height = pdfHeight;
          width = pdfHeight * ratio;
        }

        const x = (pdfWidth - width) / 2;
        const y = (pdfHeight - height) / 2;

        pdf.addImage(imgData, 'PNG', x, y, width, height);
        pdf.save(`${diagramName || 'diagrama'}-${Date.now()}.pdf`);
      }

      onClose();
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar diagrama');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Exportar Diagrama como Imagem">
      <div className="space-y-4 p-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">Formato</label>
          <div className="flex gap-3">
            <button
              onClick={() => setFormat('png')}
              className={`flex-1 px-4 py-2 rounded transition ${
                format === 'png'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              📷 PNG
            </button>
            <button
              onClick={() => setFormat('pdf')}
              className={`flex-1 px-4 py-2 rounded transition ${
                format === 'pdf'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              📄 PDF
            </button>
          </div>
        </div>

        <div className="bg-slate-800/50 p-3 rounded text-sm text-slate-400">
          <div className="font-semibold text-slate-300 mb-2">ℹ️ Informações</div>
          <ul className="space-y-1">
            <li>✓ Exporta o diagrama atual em alta resolução</li>
            <li>✓ Mantém cores e ícones</li>
            <li>✓ Arquivo salvo localmente</li>
          </ul>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t border-slate-700">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isExporting}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleExport} disabled={isExporting}>
            {isExporting ? '⏳ Exportando...' : `📥 Exportar ${format.toUpperCase()}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
