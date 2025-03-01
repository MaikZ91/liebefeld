
import html2canvas from 'html2canvas';

/**
 * Captures an HTML element and downloads it as a PNG file
 * @param elementId The ID of the element to capture
 * @param fileName The name for the downloaded file
 */
export const downloadElementAsPng = async (elementId: string, fileName: string = 'calendar') => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID ${elementId} not found`);
    }

    // Create a canvas from the element
    const canvas = await html2canvas(element, {
      backgroundColor: '#131722',
      scale: 2, // Higher scale for better quality
      logging: false,
      useCORS: true, // To handle images from different origins
    });

    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL('image/png');
    
    // Create a download link
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = dataUrl;
    link.click();
    
    return true;
  } catch (error) {
    console.error('Error downloading image:', error);
    return false;
  }
};
