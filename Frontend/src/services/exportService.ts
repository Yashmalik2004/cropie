import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import type { Farm, HeatmapData } from '@/types/farm';

/**
 * Utility function to format date for filenames (YYYY-MM-DD_HHmmss)
 */
const getTimestampSuffix = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}${minutes}${seconds}`;
};

/**
 * Trigger file download by creating a blob and anchor element
 */
const triggerDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Flatten nested heatmap data for CSV export
 */
const flattenHeatmapData = (heatmapData: HeatmapData | null): Record<string, string | number> => {
  if (!heatmapData) {
    return {};
  }

  return {
    // Location
    district: heatmapData.location?.district ?? 'N/A',
    state: heatmapData.location?.state ?? 'N/A',
    address: heatmapData.location?.complete_address ?? 'N/A',
    latitude: heatmapData.location?.coordinates?.latitude ?? 'N/A',
    longitude: heatmapData.location?.coordinates?.longitude ?? 'N/A',

    // Pixel counts (health)
    valid_pixels: heatmapData.pixel_counts?.valid ?? 0,
    stressed_pixels: heatmapData.pixel_counts?.red ?? 0,
    moderate_pixels: heatmapData.pixel_counts?.yellow ?? 0,
    healthy_pixels: heatmapData.pixel_counts?.green ?? 0,

    // Percentages
    stressed_percent: heatmapData.pixel_counts?.red && heatmapData.pixel_counts?.valid
      ? ((heatmapData.pixel_counts.red / heatmapData.pixel_counts.valid) * 100).toFixed(1)
      : 'N/A',
    moderate_percent: heatmapData.pixel_counts?.yellow && heatmapData.pixel_counts?.valid
      ? ((heatmapData.pixel_counts.yellow / heatmapData.pixel_counts.valid) * 100).toFixed(1)
      : 'N/A',
    healthy_percent: heatmapData.pixel_counts?.green && heatmapData.pixel_counts?.valid
      ? ((heatmapData.pixel_counts.green / heatmapData.pixel_counts.valid) * 100).toFixed(1)
      : 'N/A',

    // Thresholds
    threshold_1: heatmapData.thresholds?.t1 ?? 'N/A',
    threshold_2: heatmapData.thresholds?.t2 ?? 'N/A',

    // Assessment
    overall_assessment: heatmapData.suggestions?.overall_assessment ?? 'N/A',

    // Date reference
    date_used: heatmapData.date_used ?? 'N/A',
  };
};

/**
 * Export farm data as CSV
 * Includes farm details and flattened heatmap analysis
 */
export const exportFarmDataAsCSV = (farm: Farm | null, heatmapData: HeatmapData | null): void => {
  if (!farm) return;

  const timestamp = getTimestampSuffix();
  const filename = `${farm.name.replace(/\s+/g, '_')}_data_${timestamp}.csv`;

  // Prepare farm data
  const farmData = {
    farm_id: farm.id,
    farm_name: farm.name,
    crop: farm.crop,
    planting_date: farm.plantingDate,
    harvest_date: farm.harvestDate,
    description: farm.description ?? 'N/A',
    area_hectares: farm.area,
    created_at: farm.createdAt,
    updated_at: farm.updatedAt,
  };

  // Merge farm + heatmap data
  const flatHeatmap = flattenHeatmapData(heatmapData);
  const allData = { ...farmData, ...flatHeatmap };

  // Convert to CSV
  const headers = Object.keys(allData);
  const csvHeaders = headers.join(',');
  const csvValues = headers.map(key => {
    const value = allData[key as keyof typeof allData];
    const stringValue = String(value ?? '');
    // Escape quotes and wrap in quotes if contains comma
    return stringValue.includes(',') ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
  }).join(',');

  const csv = `${csvHeaders}\n${csvValues}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

  triggerDownload(blob, filename);
};

/**
 * Export farm data as JSON
 * Includes complete nested structure
 */
export const exportFarmDataAsJSON = (farm: Farm | null, heatmapData: HeatmapData | null): void => {
  if (!farm) return;

  const timestamp = getTimestampSuffix();
  const filename = `${farm.name.replace(/\s+/g, '_')}_data_${timestamp}.json`;

  const exportData = {
    farm,
    heatmapData: heatmapData ?? null,
    exportedAt: new Date().toISOString(),
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });

  triggerDownload(blob, filename);
};

/**
 * Generate a PDF report with farm analysis
 * Includes yield analysis, health metrics, and recommendations
 */
export const generatePDFReport = async (farm: Farm | null, heatmapData: HeatmapData | null): Promise<void> => {
  if (!farm) return;

  const timestamp = getTimestampSuffix();
  const filename = `${farm.name.replace(/\s+/g, '_')}_report_${timestamp}.pdf`;

  const doc = new jsPDF();
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  // Helper function to add text with wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 11, isBold: boolean = false): number => {
    doc.setFontSize(fontSize);
    if (isBold) doc.setFont('', 'bold');
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    if (isBold) doc.setFont('', 'normal');
    return y + (lines.length * 5);
  };

  // Helper to check if new page needed
  const checkPageBreak = (nextY: number): number => {
    if (nextY > pageHeight - 20) {
      doc.addPage();
      return 30;
    }
    return nextY;
  };

  // Header
  doc.setFontSize(20);
  doc.setFont('', 'bold');
  doc.text('Crop Health Analysis Report', margin, yPosition);
  yPosition += 15;

  // Farm Info Section
  doc.setFontSize(12);
  doc.setFont('', 'bold');
  doc.text('Farm Information', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('', 'normal');
  const farmInfo = [
    `Farm Name: ${farm.name}`,
    `Crop: ${farm.crop}`,
    `Area: ${farm.area} hectares`,
    `Location: ${heatmapData?.location?.complete_address ?? 'N/A'}`,
    `Planting Date: ${farm.plantingDate}`,
    `Harvest Date: ${farm.harvestDate}`,
  ];

  farmInfo.forEach((info) => {
    doc.text(info, margin + 5, yPosition);
    yPosition += 7;
  });

  yPosition = checkPageBreak(yPosition + 5);

  if (heatmapData) {
    // Health Metrics Section
    if (heatmapData.pixel_counts) {
      doc.setFontSize(12);
      doc.setFont('', 'bold');
      doc.text('Field Health Overview', margin, yPosition);
      yPosition += 10;

      const validPixels = heatmapData.pixel_counts.valid || 1;
      const stressedPct = ((heatmapData.pixel_counts.red / validPixels) * 100).toFixed(1);
      const moderatePct = ((heatmapData.pixel_counts.yellow / validPixels) * 100).toFixed(1);
      const healthyPct = ((heatmapData.pixel_counts.green / validPixels) * 100).toFixed(1);

      doc.setFontSize(10);
      doc.setFont('', 'normal');
      const healthInfo = [
        `Healthy Area: ${healthyPct}%`,
        `Moderate Area: ${moderatePct}%`,
        `Stressed Area: ${stressedPct}%`,
      ];

      healthInfo.forEach((info) => {
        doc.text(info, margin + 5, yPosition);
        yPosition += 7;
      });

      yPosition = checkPageBreak(yPosition + 5);
    }

    // Recommendations Section
    if (heatmapData.suggestions) {
      doc.setFontSize(12);
      doc.setFont('', 'bold');
      doc.text('Assessment & Recommendations', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('', 'normal');
      yPosition = addWrappedText(
        `Overall Assessment: ${heatmapData.suggestions.overall_assessment ?? 'N/A'}`,
        margin + 5,
        yPosition,
        contentWidth - 10
      );
      yPosition += 5;

      if (heatmapData.suggestions.field_management && heatmapData.suggestions.field_management.length > 0) {
        doc.setFont('', 'bold');
        doc.text('Field Management:', margin + 5, yPosition);
        yPosition += 7;
        doc.setFont('', 'normal');

        heatmapData.suggestions.field_management.slice(0, 3).forEach((rec) => {
          yPosition = addWrappedText(`• ${rec}`, margin + 10, yPosition, contentWidth - 15);
          yPosition += 2;
        });

        yPosition += 3;
        yPosition = checkPageBreak(yPosition);
      }

      if (heatmapData.suggestions.immediate_actions && heatmapData.suggestions.immediate_actions.length > 0) {
        doc.setFont('', 'bold');
        doc.text('Immediate Actions:', margin + 5, yPosition);
        yPosition += 7;
        doc.setFont('', 'normal');

        heatmapData.suggestions.immediate_actions.slice(0, 3).forEach((action) => {
          yPosition = addWrappedText(`• ${action}`, margin + 10, yPosition, contentWidth - 15);
          yPosition += 2;
        });

        yPosition += 3;
        yPosition = checkPageBreak(yPosition);
      }

      if (heatmapData.suggestions.risk_alerts && heatmapData.suggestions.risk_alerts.length > 0) {
        doc.setFont('', 'bold');
        doc.text('Risk Alerts:', margin + 5, yPosition);
        yPosition += 7;
        doc.setFont('', 'normal');

        heatmapData.suggestions.risk_alerts.slice(0, 3).forEach((alert) => {
          yPosition = addWrappedText(`⚠ ${alert}`, margin + 10, yPosition, contentWidth - 15);
          yPosition += 2;
        });
      }
    }
  }

  // Footer
  doc.setFontSize(9);
  doc.setFont('', 'normal');
  doc.text(`Generated on ${new Date().toLocaleString()}`, margin, pageHeight - 10);

  doc.save(filename);
};

/**
 * Download map image from canvas element
 * Uses html2canvas to capture the map and exports as PNG
 */
export const downloadMapImage = async (mapContainerRef: HTMLElement | null): Promise<void> => {
  if (!mapContainerRef) {
    console.error('Map container reference not available');
    return;
  }

  try {
    const timestamp = getTimestampSuffix();
    const filename = `farm_map_${timestamp}.png`;

    // Capture the map canvas
    const canvas = await html2canvas(mapContainerRef, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher resolution
      useCORS: true,
      logging: false,
    });

    // Convert canvas to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        triggerDownload(blob, filename);
      }
    }, 'image/png');
  } catch (error) {
    console.error('Failed to download map image:', error);
    throw error;
  }
};

/**
 * Create a ZIP folder with multiple map images
 * Takes an array of {filename, blob} objects and creates a downloadable ZIP
 */
export const createMapImagesZip = async (
  mapImages: Array<{ filename: string; blob: Blob }>,
  farmName: string
): Promise<void> => {
  try {
    const timestamp = getTimestampSuffix();
    const zipFilename = `${farmName.replace(/\s+/g, '_')}_maps_${timestamp}.zip`;

    const zip = new JSZip();
    const folder = zip.folder('farm_maps');

    if (!folder) {
      throw new Error('Failed to create ZIP folder');
    }

    // Add each image to the ZIP
    for (const { filename, blob } of mapImages) {
      folder.file(filename, blob);
    }

    // Generate ZIP and download
    const content = await zip.generateAsync({ type: 'blob' });
    triggerDownload(content, zipFilename);
  } catch (error) {
    console.error('Failed to create map images ZIP:', error);
    throw error;
  }
};

/**
 * Decode a base64 PNG (with or without a `data:image/png;base64,` prefix)
 * into a real PNG Blob suitable for zip/disk. The backend ships some
 * masks as raw base64 and the anomaly map as a data URL, so this handles
 * both shapes.
 */
const base64ToPngBlob = (raw: string | undefined | null): Blob | null => {
  if (!raw) return null;
  const cleaned = raw.startsWith('data:')
    ? raw.substring(raw.indexOf(',') + 1)
    : raw;
  if (!cleaned) return null;
  try {
    const byteString = atob(cleaned);
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      bytes[i] = byteString.charCodeAt(i);
    }
    return new Blob([bytes], { type: 'image/png' });
  } catch (error) {
    console.error('Failed to decode base64 PNG:', error);
    return null;
  }
};

/**
 * Build the list of mask + range PNGs to ship inside the maps ZIP.
 *
 * Reads ALL images straight off the response payload - no leaflet capture,
 * no layer switching, no UI mutation. This avoids the previous behaviour
 * where the user could see the map flipping through every mask in real
 * time during export.
 *
 * Filenames follow the agreed scheme:
 *   - NDVI Health masks:  ndvi_health_{good,moderate,stressed}.png
 *   - NDVI Health range:  ndvi_health.png
 *   - NDWI Hydration:     ndwi_hydration_{moderate,low,dry}.png
 *   - NDWI Hydration range: ndwi_hydration.png
 *   - NDRE Nutrient:      ndre_nutrient_{veryHealthy,healthy,moderate,stressed}.png
 *   - NDRE Nutrient range: ndre_nutrient.png
 *   - Anomaly map:        ndvi_anomaly.png
 */
export const extractMapImagesFromHeatmapData = (
  heatmapData: HeatmapData | null
): Array<{ filename: string; blob: Blob }> => {
  if (!heatmapData) return [];

  const out: Array<{ filename: string; blob: Blob }> = [];

  const push = (filename: string, raw: string | undefined | null) => {
    const blob = base64ToPngBlob(raw);
    if (blob) out.push({ filename, blob });
  };

  // NDVI Health
  const ndvi = heatmapData.masks;
  if (ndvi) {
    push('ndvi_health_good.png', ndvi.green_mask_base64);
    push('ndvi_health_moderate.png', ndvi.yellow_mask_base64);
    push('ndvi_health_stressed.png', ndvi.red_mask_base64);
    push('ndvi_health.png', ndvi.range_mask_base64);
  }

  // NDWI Hydration
  const ndwi = heatmapData['ndwi-masks'];
  if (ndwi) {
    push('ndwi_hydration_moderate.png', ndwi.light_blue_mask_base64);
    push('ndwi_hydration_low.png', ndwi.yellow_mask_base64);
    push('ndwi_hydration_dry.png', ndwi.brown_mask_base64);
    push('ndwi_hydration.png', ndwi.range_mask_base64);
  }

  // NDRE Nutrient
  const ndre = heatmapData['ndre-masks'];
  if (ndre) {
    push('ndre_nutrient_veryHealthy.png', ndre.dark_green_mask_base64);
    push('ndre_nutrient_healthy.png', ndre.light_green_mask_base64);
    push('ndre_nutrient_moderate.png', ndre.pink_mask_base64);
    push('ndre_nutrient_stressed.png', ndre.purple_mask_base64);
    push('ndre_nutrient.png', ndre.range_mask_base64);
  }

  // Anomaly map (the field is named `tile_urls.anomaly_heatmap` but the
  // value is actually a base64 data URL produced by the classifier).
  push('ndvi_anomaly.png', heatmapData.anomaly?.tile_urls?.anomaly_heatmap);

  return out;
};

/**
 * Capture a specific HTML element and return as blob
 */
export const captureElementAsBlob = async (element: HTMLElement | null): Promise<Blob | null> => {
  if (!element) return null;

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  } catch (error) {
    console.error('Failed to capture element:', error);
    return null;
  }
};
