import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import Login from './pages/Login';
import Register from './pages/Register';
import Navbar from './components/layout/Navbar';
import PrivateRoute from './components/auth/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/dashboard" 
            element={<PrivateRoute component={Dashboard} />} 
          />
          <Route 
            path="/editor/:id" 
            element={<PrivateRoute component={Editor} />} 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;