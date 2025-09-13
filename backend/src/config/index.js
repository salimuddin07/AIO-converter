export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  maxBatchCount: parseInt(process.env.MAX_BATCH_COUNT || '30', 10),
  jpegQuality: parseInt(process.env.JPEG_QUALITY || '80', 10),
  fileTTLMinutes: parseInt(process.env.FILE_TTL_MINUTES || '30', 10)
};

export const supportedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.bmp', '.tiff', '.mp4', '.avi', '.mov', '.webm'];
export const convertibleTargets = ['png','jpg','jpeg','gif','svg','mp4','frames'];
