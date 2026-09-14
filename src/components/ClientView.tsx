import React from 'react';
import { ImportedDocument } from '../types';
import { InteractiveDataGrid } from './InteractiveDataGrid';

interface ClientViewProps {
  document: ImportedDocument;
  onExportExcel?: () => void;
}

export const ClientView: React.FC<ClientViewProps> = ({
  document,
  onExportExcel,
}) => {
  return (
    <div className="w-full">
      <InteractiveDataGrid
        document={document}
        readOnly={true}
        onExportExcel={onExportExcel}
      />
    </div>
  );
};
