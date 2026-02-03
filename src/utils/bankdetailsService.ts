import { API_BASE_URL } from '../lib/api';

interface BankDetailsRequest {
  bankName: string;
  bankBranch: string;
  bankAccountNo: string;
  bankIFSCCode: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Updates the bank details for an instructor
 * @param bankDetails The bank details to update
 * @param token The instructor's access token
 * @returns Promise with the API response
 */
export const updateBankDetails = async (
  bankDetails: BankDetailsRequest,
  token: string
): Promise<ApiResponse<BankDetailsRequest>> => {
  try {
    const response = await fetch(`${API_BASE_URL}instructor/update-bank-details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        bankName: bankDetails.bankName.trim(),
        bankBranch: bankDetails.bankBranch.trim(),
        bankAccountNo: bankDetails.bankAccountNo.trim(),
        bankIFSCCode: bankDetails.bankIFSCCode.toUpperCase().trim(),
      }),
    });

    // Parse the response
    const contentType = response.headers.get('content-type');
    let data: any;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    if (response.ok) {
      return {
        success: true,
        data: bankDetails,
        message: data.message || 'Bank details updated successfully',
      };
    } else {
      return {
        success: false,
        error: data.message || data.error || 'Failed to update bank details',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'An error occurred while updating bank details',
    };
  }
};

/**
 * Gets the bank details for an instructor
 * @param token The instructor's access token
 * @returns Promise with the API response
 */
export const getBankDetails = async (
  token: string
): Promise<ApiResponse<BankDetailsRequest>> => {
  try {
    const response = await fetch(`${API_BASE_URL}instructor/bank-details`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const contentType = response.headers.get('content-type');
    let data: any;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    if (response.ok) {
      return {
        success: true,
        data: data.data || data,
        message: data.message || 'Bank details retrieved successfully',
      };
    } else {
      return {
        success: false,
        error: data.message || data.error || 'Failed to get bank details',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'An error occurred while fetching bank details',
    };
  }
};
