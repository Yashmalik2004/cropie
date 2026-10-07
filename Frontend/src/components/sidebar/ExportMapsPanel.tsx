import React from 'react';
import { Download, FileText, Map } from 'lucide-react';

interface ExportMapsPanelProps {
  farmName: string;
  onExportData?: (() => void) | undefined;
  onGenerateReport?: (() => void) | undefined;
  onDownloadMap?: (() => void) | undefined;
  isLoading?: boolean;
}

export const ExportMapsPanel: React.FC<ExportMapsPanelProps> = ({
  onExportData,
  onGenerateReport,
  onDownloadMap,
  isLoading = false,
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="font-semibold text-neutral-900 flex items-center">
          <Download className="h-4 w-4 mr-2" />
          Export & Maps
        </h3>
        <p className="text-xs text-neutral-600 mt-1">Download data and export reports</p>
      </div>

      {/* Export Actions */}
      <div className="space-y-2">
        <button
          onClick={onExportData}
          disabled={isLoading}
          className="w-full bg-white border border-neutral-200 rounded-lg p-3 text-left hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Download className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-neutral-900 text-sm">Export Field Data</p>
              <p className="text-xs text-neutral-600">Download as CSV/JSON</p>
            </div>
          </div>
        </button>

        <button
          onClick={onGenerateReport}
          disabled={isLoading}
          className="w-full bg-white border border-neutral-200 rounded-lg p-3 text-left hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-neutral-900 text-sm">Generate Report</p>
              <p className="text-xs text-neutral-600">PDF with analysis summary</p>
            </div>
          </div>
        </button>

        <button
          onClick={onDownloadMap}
          disabled={isLoading}
          className="w-full bg-white border border-neutral-200 rounded-lg p-3 text-left hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Map className="h-5 w-5 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-neutral-900 text-sm">Download Map Image</p>
              <p className="text-xs text-neutral-600">Save heatmap visualization</p>
            </div>
          </div>
        </button>
      </div>

      {/* Map Layers Info */}
      <div className="bg-white rounded-lg p-4 border border-neutral-200">
        <h4 className="text-sm font-semibold text-neutral-900 mb-3">Available Visualizations</h4>
        <div className="space-y-2">
          <div className="flex items-start space-x-3 pb-2 border-b border-neutral-100">
            <div className="h-6 w-6 bg-gradient-to-br from-red-400 to-red-600 rounded flex-shrink-0 mt-0.5"></div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-neutral-900">Health Map (NDVI)</p>
              <p className="text-xs text-neutral-600">Crop health from multispectral analysis</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 pb-2 border-b border-neutral-100">
            <div className="h-6 w-6 bg-gradient-to-br from-purple-400 to-pink-600 rounded flex-shrink-0 mt-0.5"></div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-neutral-900">Nutrient Map (NDRE)</p>
              <p className="text-xs text-neutral-600">Red-edge index for nutrient status</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 pb-2 border-b border-neutral-100">
            <div className="h-6 w-6 bg-gradient-to-br from-amber-400 to-blue-600 rounded flex-shrink-0 mt-0.5"></div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-neutral-900">Hydration Map (NDWI)</p>
              <p className="text-xs text-neutral-600">Water stress and moisture levels</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="h-6 w-6 bg-gradient-to-br from-orange-400 to-red-600 rounded flex-shrink-0 mt-0.5"></div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-neutral-900">Trend Map (NDVI Anomaly)</p>
              <p className="text-xs text-neutral-600">Deviations from expected patterns</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
