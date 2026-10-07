import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import { useFarms } from '../hooks/useFarms';
import type { FarmFormData } from '../types/farm';
import { CROP_OPTIONS, calculateCropDates } from '../types/farm';
import { LeafletMap } from '../components/map/LeafletMap';
import {
  ArrowLeft,
  Sprout,
  MapPin,
  Calendar,
  Plus,
  FileText,
  User,
  Activity,
  Map,
} from 'lucide-react';
import { formatHectares } from '@/utils';
import cropData from '@/assets/p.json';
import { toast } from 'robot-toast';

export const CreateFarm: React.FC = () => {
  const navigate = useNavigate();
  const { isGuestMode } = useAuth();
  const { addFarm, loading, error } = useFarms();
  const [coordinates, setCoordinates] = useState<number[][]>([]);
  const [area, setArea] = useState<number>(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FarmFormData>();

  const plantingDate = watch('plantingDate');
  const selectedCrop = watch('crop');

  // Auto-fill planting and harvest dates when crop is selected
  useEffect(() => {
    if (selectedCrop) {
      const { plantingDate: autoPlantingDate, harvestDate: autoHarvestDate } = calculateCropDates(selectedCrop);
      setValue('plantingDate' as keyof FarmFormData, autoPlantingDate);
      setValue('harvestDate' as keyof FarmFormData, autoHarvestDate);
    }
  }, [selectedCrop, setValue]);

  useEffect(() => {
    if (plantingDate && selectedCrop) {
      const cropInfo = cropData.find(crop => crop.name === selectedCrop);
      if (cropInfo) {
        const planting = new Date(plantingDate);
        const harvestDate = new Date(
          planting.getTime() + cropInfo.min_duration * 24 * 60 * 60 * 1000
        );
        const harvestDateString = harvestDate.toISOString().split('T')[0];
        setValue('harvestDate' as keyof FarmFormData, harvestDateString);
      }
    }
  }, [plantingDate, selectedCrop, setValue]);

  // Show error toast when error state changes
  useEffect(() => {
    if (error) {
      toast.error({
        message: error,
        robotVariant: '/wheat-error.png',
        autoClose: 3000,
      });
    }
  }, [error]);

  const onSubmit = async (data: FarmFormData) => {
    if (coordinates.length === 0) {
      toast.error({
        message: 'Please draw your farm boundary on the map',
        robotVariant: '/wheat-error.png',
        autoClose: 3000,
      });
      return;
    }

    if (loading) {
      console.log(
        'Farm creation already in progress, ignoring duplicate submission'
      );
      return;
    }

    console.log('Creating farm with data:', data);

    try {
      await addFarm(data, coordinates, area);
      toast.success({
        message: 'Farm created successfully!',
        robotVariant: '/wheat-base.png',
        autoClose: 3000,
      });
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (error) {
      console.error('Error creating farm:', error);
    }
  };

  const handlePolygonComplete = useCallback(
    (coords: number[][], calculatedArea: number) => {
      setCoordinates(coords);
      setArea(calculatedArea);
    },
    []
  );

  return (
    <div className='min-h-screen gradient-mesh'>
      {/* Header */}
      <header className='glass border-b border-white/10 sticky top-0 z-[2000]'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center py-4'>
            <div className='flex items-center animate-in'>
              <button
                onClick={() => navigate('/dashboard')}
                className='mr-4 p-2.5 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-white/50 transition-all'
              >
                <ArrowLeft className='h-5 w-5' />
              </button>
              <div className='flex items-start space-x-4'>
                <div className='h-12 w-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-glow'>
                  <Plus className='h-6 w-6 text-white' />
                </div>
                <div>
                  <h1 className='text-3xl font-bold text-neutral-900'>
                    Create New Farm
                  </h1>
                  <div className='flex items-center space-x-3 mt-1'>
                    <span className='text-sm text-neutral-600'>
                      Add your farm details and map boundaries
                    </span>
                    {isGuestMode && (
                      <div className='badge-info'>
                        <User className='h-3 w-3 mr-1' />
                        Guest Mode - Local Save
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className='max-w-6xl mx-auto px-4 py-8'>
        <div className='card-elevated animate-in'>
          <form onSubmit={handleSubmit(onSubmit)} className='p-8 space-y-8'>
            {/* Farm Details Section */}
            <div>
              <div className='flex items-center space-x-3 mb-6'>
                <div className='h-10 w-10 bg-gradient-to-br from-secondary-500 to-secondary-700 rounded-xl flex items-center justify-center'>
                  <FileText className='h-5 w-5 text-white' />
                </div>
                <div>
                  <h2 className='text-xl font-semibold text-neutral-900'>
                    Farm Details
                  </h2>
                  <p className='text-sm text-neutral-600'>
                    Basic information about your farm
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Farm Name */}
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-neutral-700'>
                    Farm Name *
                  </label>
                  <div className='relative'>
                    <input
                      type='text'
                      {...register('name', {
                        required: 'Farm name is required',
                        minLength: {
                          value: 2,
                          message: 'Name must be at least 2 characters',
                        },
                      })}
                      className='input pl-10'
                      placeholder='Enter farm name'
                    />
                    <Sprout className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400' />
                  </div>
                  {errors.name && (
                    <p className='text-red-500 text-sm flex items-center'>
                      <Activity className='h-3 w-3 mr-1' />
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Crop Type */}
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-neutral-700'>
                    Crop Type *
                  </label>
                  <div className='relative'>
                    <select
                      {...register('crop', {
                        required: 'Please select a crop type',
                      })}
                      className='input pl-10 appearance-none'
                    >
                      <option value=''>Select crop type</option>
                      {CROP_OPTIONS.map(crop => (
                        <option key={crop} value={crop}>
                          {crop}
                        </option>
                      ))}
                    </select>
                    <Sprout className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400' />
                  </div>
                  {errors.crop && (
                    <p className='text-red-500 text-sm flex items-center'>
                      <Activity className='h-3 w-3 mr-1' />
                      {errors.crop.message}
                    </p>
                  )}
                </div>

                {/* Planting Date */}
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-neutral-700'>
                    Planting Date *
                  </label>
                  <div className='relative'>
                    <input
                      type='date'
                      {...register('plantingDate', {
                        required: 'Planting date is required',
                      })}
                      className='input pl-10'
                    />
                    <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400' />
                  </div>
                  {errors.plantingDate && (
                    <p className='text-red-500 text-sm flex items-center'>
                      <Activity className='h-3 w-3 mr-1' />
                      {errors.plantingDate.message}
                    </p>
                  )}
                </div>

                {/* Harvest Date */}
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-neutral-700'>
                    Harvest Date *
                  </label>
                  <div className='relative'>
                    <input
                      type='date'
                      {...register('harvestDate', {
                        required: 'Harvest date is required',
                        validate: value => {
                          if (plantingDate && value <= plantingDate) {
                            return 'Harvest date must be after planting date';
                          }
                          return true;
                        },
                      })}
                      className='input pl-10'
                    />
                    <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400' />
                  </div>
                  {selectedCrop && plantingDate && (
                    <p className='text-xs text-green-600 flex items-center'>
                      <Activity className='h-3 w-3 mr-1' />
                      Auto-calculated based on {selectedCrop} minimum growing
                      duration
                    </p>
                  )}
                  {errors.harvestDate && (
                    <p className='text-red-500 text-sm flex items-center'>
                      <Activity className='h-3 w-3 mr-1' />
                      {errors.harvestDate.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className='md:col-span-2 space-y-2'>
                  <label className='block text-sm font-medium text-neutral-700'>
                    Farm Description (Optional)
                  </label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className='input resize-none'
                    placeholder='Describe your farm, soil type, irrigation methods, or any other relevant details...'
                  />
                </div>
              </div>
            </div>

            {/* Map Section */}
            <div className='border-t border-neutral-200 pt-8'>
              <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center space-x-3'>
                  <div className='h-10 w-10 bg-gradient-to-br from-accent-500 to-accent-700 rounded-xl flex items-center justify-center'>
                    <Map className='h-5 w-5 text-white' />
                  </div>
                  <div>
                    <h2 className='text-xl font-semibold text-neutral-900'>
                      Farm Boundary
                    </h2>
                    <p className='text-sm text-neutral-600'>
                      Draw your farm boundary on the map
                    </p>
                  </div>
                </div>
              </div>

              <div className='space-y-6'>
                <div className='rounded-xl overflow-hidden border border-neutral-200 shadow-soft'>
                  <LeafletMap
                    onPolygonComplete={handlePolygonComplete}
                    height='500px'
                    className='w-full'
                    allowPolygon={false}
                  />
                </div>

                {coordinates.length > 0 && (
                  <div className='card bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-l-green-500 p-6 animate-in'>
                    <div className='flex items-center justify-between flex-wrap gap-4'>
                      <div className='flex items-center space-x-2'>
                        <div className='h-8 w-8 bg-green-200 rounded-lg flex items-center justify-center'>
                          <MapPin className='h-4 w-4 text-green-700' />
                        </div>
                        <div>
                          <p className='text-sm font-medium text-green-800'>
                            Calculated Area
                          </p>
                          <p className='text-lg font-bold text-green-700'>
                            {formatHectares(area)} ha
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <div className='h-8 w-8 bg-green-200 rounded-lg flex items-center justify-center'>
                          <Activity className='h-4 w-4 text-green-700' />
                        </div>
                        <div>
                          <p className='text-sm font-medium text-green-800'>
                            Boundary Points
                          </p>
                          <p className='text-lg font-bold text-green-700'>
                            {coordinates.length} mapped
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center space-x-2 text-green-600'>
                        <div className='h-2 w-2 bg-green-500 rounded-full animate-pulse'></div>
                        <span className='text-sm font-medium'>
                          Boundary marked
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {coordinates.length === 0 && (
                  <div className='card bg-gradient-to-r from-amber-50 to-orange-100 border-l-4 border-l-amber-500 p-6'>
                    <div className='flex items-start space-x-3'>
                      <div className='flex-shrink-0'>
                        <Map className='h-5 w-5 text-amber-600' />
                      </div>
                      <div>
                        <p className='text-sm font-medium text-amber-800 mb-1'>
                          Boundary Required
                        </p>
                        <p className='text-sm text-amber-700'>
                          Use the drawing tools to define your farm boundary —
                          place a square, drag a rectangle, or draw a polygon.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error Display removed - now using toast notifications */}

            {/* Action Buttons */}
            <div className='flex justify-between items-center pt-8 border-t border-neutral-200'>
              <button
                type='button'
                onClick={() => navigate('/dashboard')}
                className='btn-ghost group'
              >
                <ArrowLeft className='h-4 w-4 mr-2 group-hover:-translate-x-0.5 transition-transform' />
                Cancel
              </button>

              <button
                type='submit'
                disabled={loading || coordinates.length === 0}
                className='btn-primary btn-lg group disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {loading ? (
                  <div className='flex items-center'>
                    <div className='animate-spin rounded-full h-4 w-4 border-2 border-primary-200 border-t-white mr-3'></div>
                    Creating...
                  </div>
                ) : (
                  <>
                    <Plus className='h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-200' />
                    Create Farm
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
