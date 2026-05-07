import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import DashboardLayout from './components/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import Workers from './pages/dashboard/Workers';
import Sites from './pages/dashboard/Sites';
import Attendance from './pages/dashboard/Attendance';
import Salary from './pages/dashboard/Salary';
import CMS from './pages/dashboard/CMS';
import MySiteWorkers from './pages/dashboard/MySiteWorkers';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="workers" element={<Workers />} />
          <Route path="sites" element={<Sites />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="salary" element={<Salary />} />
          <Route path="cms" element={<CMS />} />
          <Route path="my-workers" element={<MySiteWorkers />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
