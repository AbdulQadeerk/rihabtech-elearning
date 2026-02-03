import apiClient from './axiosInterceptor';

// Generic API service class
class ApiService {
  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE', 
    endpoint: string, 
    data?: any,
    params?: any,
    options?: { timeout?: number }
  ): Promise<T> {
    try {
      const url = `${endpoint}`;
      console.log(`🚀 API Request: ${method} ${url}`, { data, params });
      
      const response = await apiClient({
        method,
        url,
        data,
        params,
        timeout: options?.timeout, // Allow per-request timeout override
      });
      
      console.log(`✅ API Success: ${method} ${url}`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`❌ API Error (${method} ${endpoint}):`, error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Handle specific error cases (401 is handled by axios interceptor)
      if (error.response?.status === 403) {
        console.error('Access forbidden');
        throw new Error('Access forbidden. You do not have permission to perform this action.');
      } else if (error.response?.status >= 500) {
        console.error('Server error');
        throw new Error('Server error. Please try again later.');
      } else if (error.response?.status === 400 || error.response?.status === 422) {
        // Handle validation errors (400 Bad Request or 422 Unprocessable Entity)
        // Preserve the original error object so response data is available
        const apiError: any = new Error();
        
        // Check if response.data is a string (direct error message)
        if (typeof error.response?.data === 'string') {
          console.error('API Error (string):', error.response.data);
          apiError.message = error.response.data;
        }
        // Check if response.data is an object with errors array
        else if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
          // Show the first validation error to the user
          const firstError = error.response.data.errors[0];
          console.error('Validation Error:', firstError);
          apiError.message = firstError;
        }
        // Check if response.data is an object with message property
        else if (error.response?.data?.message) {
          // Show the API error message
          console.error('API Error:', error.response.data.message);
          apiError.message = error.response.data.message;
        }
        // Check other possible error fields
        else if (error.response?.data?.error) {
          console.error('API Error (error field):', error.response.data.error);
          apiError.message = error.response.data.error;
        }
        else {
          // If no specific message, try other possible fields
          const errorMsg = error.response?.data?.title || error.message || 'Request failed';
          console.error('API Error (fallback):', errorMsg);
          apiError.message = errorMsg;
        }
        
        // Preserve response data for component error handling
        apiError.response = error.response;
        throw apiError;
      }
      
      // For other errors, preserve the original error but ensure message is available
      if (!error.message && error.response?.data) {
        const errorMsg = error.response.data.message || error.response.data.error || `Request failed with status code ${error.response.status}`;
        const apiError: any = new Error(errorMsg);
        apiError.response = error.response;
        throw apiError;
      }
      
      throw error;
    }
  }

  // Generic CRUD methods
  async get<T>(endpoint: string, params?: any, options?: { timeout?: number }): Promise<T> {
    return this.makeRequest<T>('GET', endpoint, undefined, params, options);
  }

  async post<T>(endpoint: string, data?: any, options?: { timeout?: number }): Promise<T> {
    return this.makeRequest<T>('POST', endpoint, data, undefined, options);
  }

  async put<T>(endpoint: string, data?: any, options?: { timeout?: number }): Promise<T> {
    return this.makeRequest<T>('PUT', endpoint, data, undefined, options);
  }

  async delete<T>(endpoint: string, data?: any, options?: { timeout?: number }): Promise<T> {
    return this.makeRequest<T>('DELETE', endpoint, data, undefined, options);
  }
}

export const apiService = new ApiService();
export default apiService;
