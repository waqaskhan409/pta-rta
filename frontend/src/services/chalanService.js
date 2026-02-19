import apiClient from './apiClient';

// Chalan APIs
export const chalanAPI = {
  // List chalans
  getChalans: (params = {}) => apiClient.get('/chalans/', { params }),

  // Get single chalan
  getChalan: (id) => apiClient.get(`/chalans/${id}/`),

  // Create new chalan
  createChalan: (data) => apiClient.post('/chalans/', data),

  // Update chalan
  updateChalan: (id, data) => apiClient.patch(`/chalans/${id}/`, data),

  // Mark chalan as paid
  markAsPaid: (id, data) => apiClient.post(`/chalans/${id}/mark_as_paid/`, data),

  // Update chalan fees
  updateFees: (id, data) => apiClient.patch(`/chalans/${id}/update_fees/`, data),

  // Cancel chalan
  cancelChalan: (id, data) => apiClient.post(`/chalans/${id}/cancel/`, data),

  // Get chalan statistics
  getStatistics: () => apiClient.get('/chalans/statistics/'),

  // Get chalan history
  getHistory: (id) => apiClient.get(`/chalans/${id}/history/`),
};

// Vehicle Fee Structure APIs
export const vehicleFeeAPI = {
  // List fee structures
  getFeeStructures: (params = {}) => apiClient.get('/vehicle-fee-structures/', { params }),

  // Get single fee structure
  getFeeStructure: (id) => apiClient.get(`/vehicle-fee-structures/${id}/`),

  // Create fee structure
  createFeeStructure: (data) => apiClient.post('/vehicle-fee-structures/', data),

  // Update fee structure
  updateFeeStructure: (id, data) => apiClient.patch(`/vehicle-fee-structures/${id}/`, data),

  // Delete fee structure
  deleteFeeStructure: (id) => apiClient.delete(`/vehicle-fee-structures/${id}/`),

  // Get fee structure by vehicle type
  getByVehicleType: (vehicleTypeId) =>
    apiClient.get('/vehicle-fee-structures/by_vehicle/', { params: { vehicle_type_id: vehicleTypeId } }),

  // Get active fee structures only
  getActive: () => apiClient.get('/vehicle-fee-structures/active_only/'),
};

// Vehicle Type APIs
export const vehicleTypeAPI = {
  // List vehicle types
  getVehicleTypes: (params = {}) => apiClient.get('/vehicle-types/', { params }),

  // Get single vehicle type
  getVehicleType: (id) => apiClient.get(`/vehicle-types/${id}/`),
};
