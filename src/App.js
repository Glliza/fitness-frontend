import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Menu from './components/Menu';
import LoginPage from './pages/LoginPage';
import ZonesPage from './pages/ZonesPage';
import EquipmentPage from './pages/EquipmentPage';
import ConsumablesPage from './pages/ConsumablesPage';
import TORepairPages from './pages/TORepairPages';
import InventarizationPage from './pages/InventarizationPage';
import RequestBuyPage from './pages/RequestBuyPage';
import HistoryPage from './pages/HistoryPage';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/" element={
                        <ProtectedRoute>
                            <>
                                <Menu />
                                <Navigate to="/zones" replace />
                            </>
                        </ProtectedRoute>
                    } />
                    <Route path="/zones" element={
                        <ProtectedRoute>
                            <>
                                <Menu />
                                <ZonesPage />
                            </>
                        </ProtectedRoute>
                    } />
                    <Route path="/equipment" element={
                        <ProtectedRoute>
                            <>
                                <Menu />
                                <EquipmentPage />
                            </>
                        </ProtectedRoute>
                    } />
                    <Route path="/consumables" element={
                        <ProtectedRoute>
                            <>
                                <Menu />
                                <ConsumablesPage />
                            </>
                        </ProtectedRoute>
                    } />
                    <Route path="/torepair" element={
                        <ProtectedRoute>
                            <>
                                <Menu />
                                <TORepairPages />
                            </>
                        </ProtectedRoute>
                    } />
                    <Route path="/inventarization" element={
                        <ProtectedRoute>
                            <>
                                <Menu />
                                <InventarizationPage />
                            </>
                        </ProtectedRoute>
                    } />
                    <Route path="/requestbuy" element={
                        <ProtectedRoute>
                            <>
                                <Menu />
                                <RequestBuyPage />
                            </>
                        </ProtectedRoute>
                    } />


                    // Добавьте в Routes:
                    <Route path="/history" element={
                        <ProtectedRoute>
                            <>
                                <Menu />
                                <HistoryPage />
                            </>
                        </ProtectedRoute>
                    } />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;