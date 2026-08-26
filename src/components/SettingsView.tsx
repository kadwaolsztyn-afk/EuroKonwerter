import React from 'react';
import { ImportedDocument, ViewMode, DocumentRow } from '../types';
import { OriginalIframeViewer } from './OriginalIframeViewer';
import { InteractiveDataGrid } from './InteractiveDataGrid';
import { ImageGalleryView } from './ImageGalleryView';
import { AnalyticsView } from './AnalyticsView';
import { BackupRestoreSettings } from './BackupRestoreSettings';

interface SettingsViewProps {
  document: ImportedDocument;
  viewMode: ViewMode;
  zoom: number;
  onBatchAttachImages: (files: File[]) => void;
  onOpenUpload: () => void;
  onExportExcel: () => void;
  onExportHtml?: () => void;
  onUpdateRowImage: (rowId: number, imageUrl: string) => void;
  onUpdateRows?: (updatedRows: DocumentRow[]) => void;
  onRestoreBackup?: (doc: ImportedDocument) => void;
  onResetTo35Brands?: () => void;
  onSaveToServer?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  document,
  viewMode,
  zoom,
  onBatchAttachImages,
  onOpenUpload,
  onExportExcel,
  onExportHtml = () => {},
  onUpdateRowImage,
  onUpdateRows,
  onRestoreBackup = () => {},
  onResetTo35Brands,
  onSaveToServer,
}) => {
  return (
    <div className="w-full">
      {viewMode === 'backup' && (
        <BackupRestoreSettings
          document={document}
          onRestoreBackup={onRestoreBackup}
          onExportExcel={onExportExcel}
          onExportHtml={onExportHtml}
          onResetTo35Brands={onResetTo35Brands}
          onSaveToServer={onSaveToServer}
          onOpenUpload={onOpenUpload}
        />
      )}

      {viewMode === 'original' && (
        <OriginalIframeViewer
          document={document}
          zoom={zoom}
          onBatchAttachImages={onBatchAttachImages}
          onOpenUpload={onOpenUpload}
        />
      )}

      {viewMode === 'grid' && (
        <InteractiveDataGrid
          document={document}
          onExportExcel={onExportExcel}
          onUpdateRowImage={onUpdateRowImage}
          onBatchAttachImages={onBatchAttachImages}
          onUpdateRows={onUpdateRows}
        />
      )}

      {viewMode === 'gallery' && (
        <ImageGalleryView
          document={document}
          onUpdateRowImage={onUpdateRowImage}
          onBatchAttachImages={onBatchAttachImages}
        />
      )}

      {viewMode === 'analytics' && (
        <AnalyticsView document={document} />
      )}
    </div>
  );
};
