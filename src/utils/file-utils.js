import fs from 'fs/promises';
import path from 'path';

export async function ensureDirectory(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return true;
  } catch (error) {
    if (error.code === 'EEXIST') {
      return true;
    }
    throw error;
  }
}

export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function getFileExtension(filePath) {
  return path.extname(filePath).toLowerCase();
}

export function getFileName(filePath, withExtension = true) {
  const basename = path.basename(filePath);
  return withExtension ? basename : path.basename(filePath, path.extname(filePath));
}

export function getOutputPath(inputPath, extension, outputDir) {
  const basename = path.basename(inputPath, path.extname(inputPath));
  return path.join(outputDir, `${basename}.${extension}`);
}

export async function readFileSafe(filePath) {
  try {
    return await fs.readFile(filePath);
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error.message}`);
  }
}

export async function writeFileSafe(filePath, data) {
  await ensureDirectory(path.dirname(filePath));
  return await fs.writeFile(filePath, data);
}
