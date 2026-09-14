import { importDocumentFromFile } from './fileImporter';
import { ImportedDocument } from '../types';

export async function parseExcelDocument(
  file: File
): Promise<ImportedDocument> {
  return importDocumentFromFile(file);
}

