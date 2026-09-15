import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminDashboard from './pages/AdminDashboard';
import 'remixicon/fonts/remixicon.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/dashboard" element={<AdminDashboard/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
