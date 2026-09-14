import React from 'react';
import { ImportedDocument } from '../types';
import { InteractiveDataGrid } from './InteractiveDataGrid';

interface WholesaleViewProps {
  document: ImportedDocument;
  onExportExcel?: () => void;
}

export const WholesaleView: React.FC<WholesaleViewProps> = ({
  document,
  onExportExcel,
}) => {
  return (
    <div className="w-full">
      <InteractiveDataGrid
        document={document}
        readOnly={true}
        showBrokerPrices={true}
        onExportExcel={onExportExcel}
      />
    </div>
  );
};
