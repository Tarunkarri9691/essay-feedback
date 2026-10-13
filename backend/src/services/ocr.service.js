import Tesseract from 'tesseract.js';

export async function extractTextFromImage(imageBuffer) {
  if (!imageBuffer) return '';
  const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng');
  return (text || '').trim();
}
