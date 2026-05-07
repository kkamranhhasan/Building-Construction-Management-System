// Central API configuration
// All API calls use this base URL so we can easily switch between local and production
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const API = {
  // Auth
  login: `${API_BASE}/api/auth/login`,
  signup: `${API_BASE}/api/auth/signup`,
  me: `${API_BASE}/api/auth/me`,

  // Sites
  sites: `${API_BASE}/api/sites`,
  site: (id: string) => `${API_BASE}/api/sites/${id}`,
  assignSite: (id: string) => `${API_BASE}/api/sites/${id}/assign`,
  removeSite: (id: string) => `${API_BASE}/api/sites/${id}/remove`,
  siteWorkers: (id: string) => `${API_BASE}/api/sites/${id}/workers`,
  myWorkers: `${API_BASE}/api/sites/my-workers`,

  // Users
  users: `${API_BASE}/api/users`,
  user: (id: string) => `${API_BASE}/api/users/${id}`,
  approveUser: (id: string) => `${API_BASE}/api/users/${id}/approve`,

  // Attendance
  checkin: `${API_BASE}/api/attendance/checkin`,
  checkout: `${API_BASE}/api/attendance/checkout`,
  attendance: `${API_BASE}/api/attendance`,

  // Salary
  calculateSalary: `${API_BASE}/api/salary/calculate`,
  salaryReports: `${API_BASE}/api/salary/reports`,
  salary: (id: string) => `${API_BASE}/api/salary/${id}`,

  // CMS
  cmsInfo: `${API_BASE}/api/cms/info`,
  cmsProjects: `${API_BASE}/api/cms/projects`,
  cmsContact: `${API_BASE}/api/cms/contact`,
};

export const authHeaders = (token?: string | null) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const getToken = () => localStorage.getItem('token');
