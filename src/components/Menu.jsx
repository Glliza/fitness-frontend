import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Notifications from './Notifications';

const Menu = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuStyle = {
        display: 'flex',
        gap: '1rem',
        padding: '1rem',
        backgroundColor: '#343a40',
        color: 'white',
        flexWrap: 'wrap',
        alignItems: 'center',
    };

    const linkStyle = {
        color: 'white',
        textDecoration: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '4px',
    };

    const activeStyle = {
        ...linkStyle,
        backgroundColor: '#007bff',
    };

    const getActiveStyle = (path) => {
        return window.location.pathname === path ? activeStyle : linkStyle;
    };

    return (
        <div style={menuStyle}>
            <Link to="/zones" style={getActiveStyle('/zones')}>Зоны</Link>
            <Link to="/equipment" style={getActiveStyle('/equipment')}>Оборудование</Link>
            <Link to="/consumables" style={getActiveStyle('/consumables')}>Расходники</Link>
            <Link to="/torepair" style={getActiveStyle('/torepair')}>ТО и ремонты</Link>
            <Link to="/inventarization" style={getActiveStyle('/inventarization')}>Инвентаризация</Link>
            <Link to="/requestbuy" style={getActiveStyle('/requestbuy')}>Заявки на закупку</Link>
            <Link to="/history" style={getActiveStyle('/history')}>История обслуживания</Link>
            <div style={{ flex: 1 }}></div>
            <Notifications />
            <span style={{ padding: '0.5rem 1rem' }}>👤 {user?.fio || user?.login}</span>
            <button onClick={handleLogout} style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
            }}>Выйти</button>
        </div>
    );
};

export default Menu;