
import { toast } from "react-toastify";
import { makeApiCall } from '@/lib/api-utils';
const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth`;

export const sendOTP = async (email: string, name: string) => {
  try {
    const res = await makeApiCall(`${API_BASE}/send-verification-mail`, {
      method: 'POST',
      data: { email, name },
      headers: { "Content-Type": "application/json" }
    });
    if (res.statusCode == 200) {
      toast.success(res.message);
      return true;
    } else {
      toast.error(res.message);
      return false;
    }
  } catch (err: any) {
    console.log("Send OTP error", err);
    toast.error(`${err.message}`);
    return false;
  }
};

export const verifyOTP = async (email: string, otp: string) => {
  try {
    const res = await makeApiCall(`${API_BASE}/verify-otp`, {
      method: 'POST',
      data: { email, otp },
      headers: { "Content-Type": "application/json" }
    });
    if (res.statusCode == 200) {
      toast.success(res.message);
      return true;
    } else {
      toast.error(res.message);
      return false;
    }
  } catch (err: any) {
    console.log("Verify OTP error", err);
    toast.error(`${err.message}`);
    return false;
  }
};

const getUserLocation = async (): Promise<{lat: number, lng: number, state: string, district: string} | null> => {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
            
            const state = data.address?.state || '';
            const district = data.address?.state_district || data.address?.county || '';
            
            resolve({ lat, lng, state, district });
          } catch (error) {
            console.error('Failed to get location details:', error);
            resolve({ lat, lng, state: '', district: '' });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          resolve(null);
        }
      );
    } else {
      resolve(null);
    }
  });
};

export const login = async (email: string, password: string, isOfficial: boolean) => {
  try {
    const location = await getUserLocation();
    
    const res = await makeApiCall(`${API_BASE}/login`, {
      method: 'POST',
      data: { 
        email, 
        password, 
        is_official: isOfficial,
        lat: location?.lat,
        lon: location?.lng,
        state: location?.state,
        district: location?.district
      },
      headers: { "Content-Type": "application/json" }
    });
    console.log("Verify OTP response:", res);
    if (res.statusCode == 200) {
      localStorage.setItem("refreshToken", res.data.refreshToken);
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("userName", res.data.userName);
      localStorage.setItem("userPhone", res.data.phone_no); // ✅ ADDED
      localStorage.setItem("isOfficial", res.data.is_official);
      toast.success(res.message);
      return true;
    } else {
      toast.error(res.message);
      return false;
    }
  } catch (err: any) {
    console.log("Login error", err);
    toast.error(`${err.message}`);
    return false;
  }
};

export const signup = async (data: {
  email: string;
  password: string;
  confirm_password: string;
  name: string;
  phone_no: string;
}) => {
  try {
    const res = await makeApiCall(`${API_BASE}/signup`, {
      method: 'POST',
      data,
      headers: { "Content-Type": "application/json" }
    });
    if (res.statusCode == 200) {
      localStorage.setItem("userPhone", data.phone_no); // ✅ ADDED
      toast.success(res.message);
      return true;
    } else if (res.statusCode == 400) {
      toast.warning(res.message);
      return false;
    }
    else {
      toast.error(res.message);
      return false;
    }
  } catch (err: any) {
    console.log("Signup error", err);
    toast.error(`${err.message}`);
    return false;
  }
};

export const refreshToken = async (refreshToken: string) => {
  try {
    const res = await makeApiCall(`${API_BASE}/refresh-token`, {
      method: 'POST',
      data: { refresh_token: refreshToken },
      headers: { "Content-Type": "application/json" }
    });
    if (res.statusCode == 200) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.setItem("refreshToken", res.data.refreshToken);
      localStorage.setItem("accessToken", res.data.accessToken);
    } else {
      console.log("Failed to refresh token", res.message);
      throw new Error("Failed to refresh token");
    }
  } catch (err: any) {
    console.log("Refresh token error", err);
    throw new Error("Failed to refresh token");
  }
};

export const handleLogout = async (router: any) => {
  try {
    const res = await makeApiCall(`${API_BASE}/logout`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        "Content-Type": "application/json",
      },
    });
    if (res.statusCode == 200) {
      toast.success(res.message);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userName");
      localStorage.removeItem("isOfficial");
      router.push("/login");
    } else {
      toast.error(res.message || "Logout failed");
    }
  } catch (error: any) {
    console.log("logout error", error);
  }
};

export const forgotPassword = async (email: string) => {
  try {
    const res = await makeApiCall(`${API_BASE}/forgot-password`, {
      method: 'POST',
      data: { email },
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (res.statusCode == 200) {
      toast.success(res.message);
      return true;
    } else {
      toast.error(res.message);
      return false;
    }
  } catch (err: any) {
    console.log("Forgot password error", err);
    toast.error(`${err.message}`);
    return false;
  }
};

export const resetPassword = async (token: string|null, newPassword: string, confirmPassword: string) => {
  try {
    if (!token) {
      toast.error("Invalid reset link");
      return true;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return true;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return true;
    }
    const res = await makeApiCall(`${API_BASE}/reset-password`, {
      method: 'POST',
      data: { token, newPassword },
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (res.statusCode == 200) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
    return true;
  } catch (err: any) {
    console.log("Reset password error", err);
    toast.error(`${err.message}`);
    return false;
  }
};

export const apiCallWithRefresh = async (apiCall: () => Promise<any>) => {
  try {
    const res = await apiCall();
    if (res?.data?.tokenExpire || res?.tokenExpire) {
      console.log('Access token expired, attempting to refresh token');
      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (refreshTokenValue) {
        await refreshToken(refreshTokenValue);
        return await apiCall();
      } else {
        throw new Error('Failed to refresh token');
      }
    } else {
      return res;
    }
  } catch (error: any) {
    throw error;
  }
};
