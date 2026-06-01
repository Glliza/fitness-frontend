import React, { useState, useEffect } from 'react';
import { maintenanceService } from '../services/maintenanceService';
import { equipmentService } from '../services/equipmentService';
import './HistoryPage.css';

const HistoryPage = () => {
    const [equipment, setEquipment] = useState([]);
    const [allTO, setAllTO] = useState([]);
    const [allRequests, setAllRequests] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    
    const [filterEquipment, setFilterEquipment] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const equipmentRes = await equipmentService.getAll(0, 100);
            const equipmentList = equipmentRes.data.content || [];
            
            const [toRes, requestsRes] = await Promise.all([
                maintenanceService.getAllTO(0, 1000),
                maintenanceService.getAllRequests(0, 1000)
            ]);
            
            const toList = toRes.data.content || [];
            const reqList = requestsRes.data.content || [];
            
            setEquipment(equipmentList);
            setAllTO(toList);
            setAllRequests(reqList);
            
            applyFilters(toList, reqList, equipmentList);
        } catch (err) {
            console.error('Ошибка загрузки данных:', err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = (toList, reqList, equipList, equipFilter = filterEquipment, typeFilter = filterType, start = startDate, end = endDate) => {
        let events = [];
        
        toList.forEach(to => {
            const equipmentName = equipList.find(e => e.id === to.equipmentId)?.name || 'Неизвестно';
            
            events.push({
                id: to.id,
                type: 'ТО',
                subType: to.type,
                equipmentId: to.equipmentId,
                equipmentName: equipmentName,
                date: to.completedDate || to.plannedDate,
                plannedDate: to.plannedDate,
                completedDate: to.completedDate,
                description: to.description,
                status: to.status || 'Запланировано',
                source: 'to'
            });
        });
        
        reqList.forEach(req => {
            const equipmentName = equipList.find(e => e.id === req.equipmentInventoryNumber)?.name || 'Неизвестно';
            
            events.push({
                id: req.id,
                type: 'Ремонт',
                subType: 'Заявка',
                equipmentId: req.equipmentInventoryNumber,
                equipmentName: equipmentName,
                date: req.created_at ? new Date(req.created_at).toISOString().split('T')[0] : null,
                description: req.description,
                status: req.status,
                creator: req.creator,
                source: 'repair'
            });
        });
        
        if (equipFilter) {
            events = events.filter(e => e.equipmentId === parseInt(equipFilter));
        }
        
        if (typeFilter === 'to') {
            events = events.filter(e => e.source === 'to');
        } else if (typeFilter === 'repair') {
            events = events.filter(e => e.source === 'repair');
        }
        
        if (start) {
            events = events.filter(e => e.date && e.date >= start);
        }
        if (end) {
            events = events.filter(e => e.date && e.date <= end);
        }
        
        events.sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(b.date) - new Date(a.date);
        });
        
        setFilteredHistory(events);
    };

    useEffect(() => {
        applyFilters(allTO, allRequests, equipment, filterEquipment, filterType, startDate, endDate);
    }, [filterEquipment, filterType, startDate, endDate, allTO, allRequests, equipment]);

    useEffect(() => {
        loadData();
    }, []);

    const resetFilters = () => {
        setFilterEquipment('');
        setFilterType('all');
        setStartDate('');
        setEndDate('');
    };

    const getStatusBadgeClass = (status) => {
        switch(status) {
            case 'Выполнена': return 'history-status-badge-vipolnena';
            case 'Запланировано': return 'history-status-badge-zaplanirovano';
            case 'Открыта': return 'history-status-badge-otkrita';
            case 'В работе': return 'history-status-badge-vrabote';
            default: return '';
        }
    };

    const getTypeBadgeClass = (type) => {
        return type === 'ТО' ? 'history-type-badge-to' : 'history-type-badge-repair';
    };

    return (
        <div className="history-container">
            <h1 className="history-title">История обслуживания</h1>
            
            <div className="history-filter-container">
                <div className="history-filter-row">
                    <div className="history-filter-group">
                        <label className="history-filter-label">Оборудование</label>
                        <select 
                            className="history-filter-select" 
                            value={filterEquipment} 
                            onChange={(e) => setFilterEquipment(e.target.value)}
                        >
                            <option value="">Все оборудование</option>
                            {equipment.map(eq => (
                                <option key={eq.id} value={eq.id}>
                                    {eq.name} (№{eq.id})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="history-filter-group">
                        <label className="history-filter-label">Тип события</label>
                        <select 
                            className="history-filter-select" 
                            value={filterType} 
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="all">Все</option>
                            <option value="to">Только ТО</option>
                            <option value="repair">Только ремонты</option>
                        </select>
                    </div>
                    <div className="history-filter-group">
                        <label className="history-filter-label">Дата от</label>
                        <input 
                            type="date" 
                            className="history-filter-input" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="history-filter-group">
                        <label className="history-filter-label">Дата до</label>
                        <input 
                            type="date" 
                            className="history-filter-input" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <button className="history-reset-btn" onClick={resetFilters}>Сбросить фильтры</button>
                    </div>
                </div>
            </div>

            {loading ? (
                <p>Загрузка...</p>
            ) : filteredHistory.length === 0 ? (
                <div className="history-empty-message">
                    Нет записей по выбранным фильтрам
                </div>
            ) : (
                <>
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Тип</th>
                                <th>Оборудование</th>
                                <th>Описание</th>
                                <th>Дата</th>
                                <th>Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHistory.map((item, idx) => (
                                <tr key={`${item.source}_${item.id}_${idx}`}>
                                    <td>
                                        <span className={`history-type-badge ${getTypeBadgeClass(item.type)}`}>{item.type}</span>
                                        {item.subType && <div style={{ fontSize: '0.7rem', marginTop: '2px' }}>{item.subType}</div>}
                                    </td>
                                    <td>
                                        {item.equipmentName}
                                        <div style={{ fontSize: '0.7rem', color: '#666' }}>№{item.equipmentId}</div>
                                    </td>
                                    <td>{item.description || '-'}</td>
                                    <td>
                                        {item.date || '-'}
                                        {item.plannedDate && item.completedDate && (
                                            <div style={{ fontSize: '0.7rem', color: '#666' }}>
                                                План: {item.plannedDate}<br/>
                                                Вып.: {item.completedDate}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`history-status-badge ${getStatusBadgeClass(item.status)}`}>{item.status || '-'}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="history-count-info">
                        Всего записей: {filteredHistory.length}
                    </div>
                </>
            )}
        </div>
    );
};

export default HistoryPage;