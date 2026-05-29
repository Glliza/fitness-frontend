import React, { useState, useEffect } from 'react';
import { maintenanceService } from '../services/maintenanceService';
import { equipmentService } from '../services/equipmentService';
import { commonStyles } from '../styles/globalStyles';

const HistoryPage = () => {
    const [equipment, setEquipment] = useState([]);
    const [allTO, setAllTO] = useState([]);
    const [allRequests, setAllRequests] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    
    // Фильтры
    const [filterEquipment, setFilterEquipment] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const [loading, setLoading] = useState(true);

    // Загрузка всех данных
    const loadData = async () => {
        setLoading(true);
        try {
            // Загружаем оборудование (все записи, без пагинации)
            const equipmentRes = await equipmentService.getAll(0, 100);
            const equipmentList = equipmentRes.data.content || [];
            
            // Загружаем ТО и заявки (без пагинации, все записи)
            const [toRes, requestsRes] = await Promise.all([
                maintenanceService.getAllTO(0, 1000),
                maintenanceService.getAllRequests(0, 1000)
            ]);
            
            const toList = toRes.data.content || [];
            const reqList = requestsRes.data.content || [];
            
            setEquipment(equipmentList);
            setAllTO(toList);
            setAllRequests(reqList);
            
            // Применяем фильтры после загрузки
            applyFilters(toList, reqList, equipmentList);
        } catch (err) {
            console.error('Ошибка загрузки данных:', err);
        } finally {
            setLoading(false);
        }
    };

    // Применение фильтров
    const applyFilters = (toList, reqList, equipList, equipFilter = filterEquipment, typeFilter = filterType, start = startDate, end = endDate) => {
        let events = [];
        
        // Добавляем ТО
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
        
        // Добавляем заявки на ремонт
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
        
        // Фильтр по оборудованию
        if (equipFilter) {
            events = events.filter(e => e.equipmentId === parseInt(equipFilter));
        }
        
        // Фильтр по типу события
        if (typeFilter === 'to') {
            events = events.filter(e => e.source === 'to');
        } else if (typeFilter === 'repair') {
            events = events.filter(e => e.source === 'repair');
        }
        
        // Фильтр по дате
        if (start) {
            events = events.filter(e => e.date && e.date >= start);
        }
        if (end) {
            events = events.filter(e => e.date && e.date <= end);
        }
        
        // Сортируем по дате (сначала новые)
        events.sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(b.date) - new Date(a.date);
        });
        
        setFilteredHistory(events);
    };

    // При изменении фильтров
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

    const getStatusBadgeStyle = (status) => {
        switch(status) {
            case 'Выполнена': return { backgroundColor: '#28a745', color: 'white' };
            case 'Запланировано': return { backgroundColor: '#ffc107', color: '#333' };
            case 'Открыта': return { backgroundColor: '#fd7e14', color: 'white' };
            case 'В работе': return { backgroundColor: '#17a2b8', color: 'white' };
            default: return { backgroundColor: '#6c757d', color: 'white' };
        }
    };

    const styles = {
        ...commonStyles,
        filterContainer: { padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '2rem' },
        filterGroup: { flex: 1, minWidth: '150px' },
        filterLabel: { display: 'block', marginBottom: '0.25rem', fontWeight: 'bold', fontSize: '0.875rem' },
        filterSelect: { width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' },
        resetBtn: { backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', height: '38px' },
        statusBadge: (status) => ({
            display: 'inline-block',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            ...getStatusBadgeStyle(status)
        }),
        typeBadge: (type) => ({
            display: 'inline-block',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            backgroundColor: type === 'ТО' ? '#007bff' : '#dc3545',
            color: 'white'
        }),
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>История обслуживания</h1>
            
            {/* Блок фильтров */}
            <div style={styles.filterContainer}>
                <div style={styles.formRow}>
                    <div style={styles.filterGroup}>
                        <label style={styles.filterLabel}>Оборудование</label>
                        <select 
                            style={styles.filterSelect} 
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
                    <div style={styles.filterGroup}>
                        <label style={styles.filterLabel}>Тип события</label>
                        <select 
                            style={styles.filterSelect} 
                            value={filterType} 
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="all">Все</option>
                            <option value="to">Только ТО</option>
                            <option value="repair">Только ремонты</option>
                        </select>
                    </div>
                    <div style={styles.filterGroup}>
                        <label style={styles.filterLabel}>Дата от</label>
                        <input 
                            type="date" 
                            style={styles.input} 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div style={styles.filterGroup}>
                        <label style={styles.filterLabel}>Дата до</label>
                        <input 
                            type="date" 
                            style={styles.input} 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <button style={styles.resetBtn} onClick={resetFilters}>Сбросить фильтры</button>
                    </div>
                </div>
            </div>

            {/* Таблица с историей */}
            {loading ? (
                <p>Загрузка...</p>
            ) : filteredHistory.length === 0 ? (
                <div style={styles.emptyMessage}>
                    Нет записей по выбранным фильтрам
                </div>
            ) : (
                <>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Тип</th>
                                <th style={styles.th}>Оборудование</th>
                                <th style={styles.th}>Описание</th>
                                <th style={styles.th}>Дата</th>
                                <th style={styles.th}>Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHistory.map((item, idx) => (
                                <tr key={`${item.source}_${item.id}_${idx}`}>
                                    <td style={styles.td}>
                                        <span style={styles.typeBadge(item.type)}>{item.type}</span>
                                        {item.subType && <div style={{ fontSize: '0.7rem', marginTop: '2px' }}>{item.subType}</div>}
                                    </td>
                                    <td style={styles.td}>
                                        {item.equipmentName}
                                        <div style={{ fontSize: '0.7rem', color: '#666' }}>№{item.equipmentId}</div>
                                    </td>
                                    <td style={styles.td}>{item.description || '-'}</td>
                                    <td style={styles.td}>
                                        {item.date || '-'}
                                        {item.plannedDate && item.completedDate && (
                                            <div style={{ fontSize: '0.7rem', color: '#666' }}>
                                                План: {item.plannedDate}<br/>
                                                Вып.: {item.completedDate}
                                            </div>
                                        )}
                                    </td>
                                    <td style={styles.td}>
                                        <span style={styles.statusBadge(item.status)}>{item.status || '-'}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={styles.countInfo}>
                        Всего записей: {filteredHistory.length}
                    </div>
                </>
            )}
        </div>
    );
};

export default HistoryPage;