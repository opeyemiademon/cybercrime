import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const ALLOWED_EVIDENCE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/plain',
  'text/csv',
  'application/json',
  'application/xml',
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/octet-stream'
];

export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB for evidence files

export const UPLOAD_DIRS = {
  EVIDENCE: 'evidence',
  TEMP: 'temp'
};

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const EVIDENCE_DIR = path.join(UPLOAD_DIR, 'evidence');

export const ensureDirectoriesExist = (customDir?: string): void => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }

  if (customDir) {
    const fullCustomDir = path.join(EVIDENCE_DIR, customDir);
    if (!fs.existsSync(fullCustomDir)) {
      fs.mkdirSync(fullCustomDir, { recursive: true });
    }
  }
};

/**
 * Process and save a base64 evidence file upload
 * @param base64Data The base64 encoded file data
 * @param caseId The case ID to organize evidence by case
 * @param originalFilename The original filename
 * @param evidenceId Optional evidence ID for naming
 * @returns Object with filename and file path
 */
export const processEvidenceUpload = async (
  base64Data: string,
  caseId: string,
  originalFilename: string,
  evidenceId?: string
): Promise<{ filename: string; filePath: string; fileSize: number }> => {
  const caseDir = `case_${caseId}`;
  ensureDirectoriesExist(caseDir);
  
  try {
    const mimeTypeMatch = base64Data.match(/^data:([^;]+);base64,/);
    if (!mimeTypeMatch) {
      throw new Error('Invalid base64 data format');
    }
    
    const mimeType = mimeTypeMatch[1];
    
    if (!ALLOWED_EVIDENCE_TYPES.includes(mimeType)) {
      console.warn(`File type ${mimeType} not in allowed list, but allowing for evidence purposes`);
    }
    
    const extension = path.extname(originalFilename).toLowerCase() || getExtensionFromMimeType(mimeType);
    const fileId = uuidv4();
    const timestamp = Date.now();
    const safeFilename = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = evidenceId 
      ? `${evidenceId}_${timestamp}_${safeFilename}` 
      : `${fileId}_${timestamp}_${safeFilename}`;
    
    const uploadPath = path.join(EVIDENCE_DIR, caseDir);
    const filePath = path.join(uploadPath, fileName);
    
    const base64Content = base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Content, 'base64');
    
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }
    
    fs.writeFileSync(filePath, buffer);
    
    const relativePath = `/uploads/evidence/${caseDir}/${fileName}`;
    
    return {
      filename: fileName,
      filePath: relativePath,
      fileSize: buffer.length
    };
    
  } catch (error) {
    throw error;
  }
};

/**
 * Process and save a binary evidence file upload (for GraphQL Upload scalar)
 * @param file The uploaded file from GraphQL
 * @param caseId The case ID to organize evidence by case
 * @param evidenceId Optional evidence ID for naming
 * @returns Object with filename and file path
 */
export const processEvidenceFileUpload = async (
  file: any,
  caseId: string,
  evidenceId?: string
): Promise<{ filename: string; filePath: string; fileSize: number }> => {
  const caseDir = `case_${caseId}`;
  ensureDirectoriesExist(caseDir);
  
  try {
    const { createReadStream, filename, mimetype } = await file;
    
    if (!ALLOWED_EVIDENCE_TYPES.includes(mimetype)) {
      console.warn(`File type ${mimetype} not in allowed list, but allowing for evidence purposes`);
    }
    
    const timestamp = Date.now();
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const newFilename = evidenceId 
      ? `${evidenceId}_${timestamp}_${safeFilename}` 
      : `${uuidv4()}_${timestamp}_${safeFilename}`;
    
    const uploadPath = path.join(EVIDENCE_DIR, caseDir);
    const filePath = path.join(uploadPath, newFilename);
    const writeStream = fs.createWriteStream(filePath);
    
    return new Promise((resolve, reject) => {
      let fileSize = 0;
      
      const readStream = createReadStream();
      
      readStream.on('data', (chunk: Buffer) => {
        fileSize += chunk.length;
        
        if (fileSize > MAX_FILE_SIZE) {
          readStream.destroy();
          writeStream.destroy();
          
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          
          reject(new Error(`File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`));
          return;
        }
      });
      
      readStream
        .pipe(writeStream)
        .on('finish', () => {
          const relativePath = `/uploads/evidence/${caseDir}/${newFilename}`;
          resolve({
            filename: newFilename,
            filePath: relativePath,
            fileSize
          });
        })
        .on('error', (error: Error) => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          reject(error);
        });
    });
  } catch (error) {
    throw error;
  }
};

export const deleteFile = (filePath: string): void => {
  const fullPath = path.join(process.cwd(), filePath.replace(/^\//, ''));
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

function getExtensionFromMimeType(mimeType: string): string {
  const mimeMap: { [key: string]: string } = {
    'application/pdf': '.pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.ms-excel': '.xls',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/bmp': '.bmp',
    'image/tiff': '.tiff',
    'text/plain': '.txt',
    'text/csv': '.csv',
    'application/json': '.json',
    'application/xml': '.xml',
    'video/mp4': '.mp4',
    'video/mpeg': '.mpeg',
    'video/quicktime': '.mov',
    'video/x-msvideo': '.avi',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'application/zip': '.zip',
    'application/x-rar-compressed': '.rar'
  };
  
  return mimeMap[mimeType] || '.bin';
}
