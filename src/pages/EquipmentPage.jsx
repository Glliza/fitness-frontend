import React, { useState, useEffect } from 'react';
import { equipmentService } from '../services/equipmentService';
import { zoneService } from '../services/zoneService';

const EquipmentPage = () => {
    const [equipment, setEquipment] = useState([]);
    const [filteredEquipment, setFilteredEquipment] = useState([]);
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    // Фильтры
    const [filterZone, setFilterZone] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    
    const [formData, setFormData] = useState({
        zoneId: '',
        name: '',
        status: 'Новое',
        dataBuy: '',
    });

    const loadZones = async () => {
        try {
            const response = await zoneService.getAll();
            setZones(response.data);
        } catch (err) {
            console.error('Ошибка загрузки зон:', err);
        }
    };

    const loadEquipment = async () => {
        try {
            setLoading(true);
            const response = await equipmentService.getAll();
            console.log('=== ДАННЫЕ С СЕРВЕРА ===');
            console.log('Оборудование:', response.data);
            setEquipment(response.data);
            setFilteredEquipment(response.data);
            setError('');
        } catch (err) {
            setError('Ошибка загрузки оборудования');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Функция фильтрации
    const applyFilters = () => {
        let filtered = [...equipment];
        
        if (filterZone) {
            filtered = filtered.filter(item => item.zoneId === parseInt(filterZone));
        }
        
        if (filterStatus) {
            filtered = filtered.filter(item => item.status === filterStatus);
        }
        
        setFilteredEquipment(filtered);
    };

    // Сброс фильтров
    const resetFilters = () => {
        setFilterZone('');
        setFilterStatus('');
        setFilteredEquipment(equipment);
    };

    useEffect(() => {
        loadZones();
        loadEquipment();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filterZone, filterStatus, equipment]);

    const resetForm = () => {
        setFormData({
            zoneId: '',
            name: '',
            status: 'Новое',
            dataBuy: '',
        });
        setIsEditing(false);
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (item) => {
        setFormData({
            zoneId: item.zoneId || '',
            name: item.name || '',
            status: item.status || 'Новое',
            dataBuy: item.dataBuy || '',
        });
        setIsEditing(true);
        setEditingId(item.id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log('=== ОТПРАВКА ДАННЫХ ===');
        console.log('formData:', formData);
    
        if (!formData.zoneId) {
            setError('Выберите зону');
            return;
        }
        if (!formData.name) {
            setError('Введите название оборудования');
            return;
        }
        if (!formData.dataBuy) {
            setError('Выберите дату покупки');
            return;
        }

        try {
            const dataToSend = {
                zoneId: parseInt(formData.zoneId),
                name: formData.name,
                status: formData.status,
                dataBuy: formData.dataBuy,
            };
            
            if (isEditing) {
                await equipmentService.update(editingId, dataToSend);
            } else {
                await equipmentService.create(dataToSend);
            }
            resetForm();
            loadEquipment();
        } catch (err) {
            setError(isEditing ? 'Ошибка обновления оборудования' : 'Ошибка создания оборудования');
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Удалить оборудование?')) {
            try {
                await equipmentService.delete(id);
                loadEquipment();
            } catch (err) {
                setError(err.response?.data?.message || 'Ошибка удаления');
            }
        }
    };

    // Функция для получения названия зоны по ID
    const getZoneName = (zoneId) => {
        if (!zoneId) return 'Не указана';
        const zone = zones.find(z => z.id === zoneId);
        return zone ? zone.name : 'Неизвестная зона';
    };

    const styles = {
        container: { padding: '2rem' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
        filterContainer: { display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' },
        filterGroup: { flex: 1, minWidth: '150px' },
        filterLabel: { display: 'block', marginBottom: '0.25rem', fontWeight: 'bold', fontSize: '0.875rem' },
        filterSelect: { width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' },
        resetBtn: { backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', height: '38px' },
        table: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' },
        th: { border: '1px solid #ddd', padding: '0.75rem', textAlign: 'left', backgroundColor: '#f2f2f2' },
        td: { border: '1px solid #ddd', padding: '0.75rem' },
        button: { backgroundColor: '#007bff', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' },
        editBtn: { backgroundColor: '#ffc107', color: 'black', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem' },
        deleteBtn: { backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' },
        cancelBtn: { backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', marginLeft: '0.5rem' },
        formContainer: { marginTop: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white' },
        formRow: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
        formGroup: { flex: 1, minWidth: '200px' },
        label: { display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' },
        input: { width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' },
        select: { width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' },
        error: { backgroundColor: '#f8d7da', color: '#721c24', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' },
        statusBadge: (status) => ({
            display: 'inline-block',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.875rem',
            backgroundColor: status === 'Списано' ? '#dc3545' : status === 'На ремонте' ? '#ffc107' : status === 'Сломано' ? '#fd7e14' : '#28a745',
            color: status === 'Списано' || status === 'На ремонте' || status === 'Сломано' ? 'white' : 'white',
        }),
        countInfo: { marginTop: '1rem', fontSize: '0.875rem', color: '#6c757d' },
    };

    // Уникальные статусы для фильтра
    const uniqueStatuses = [...new Set(equipment.map(item => item.status))];

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1>Управление оборудованием</h1>
                {!showForm && (
                    <button style={styles.button} onClick={() => setShowForm(true)}>
                        + Добавить оборудование
                    </button>
                )}
            </div>

            {error && <div style={styles.error}>{error}</div>}

            {/* Блок фильтрации */}
            <div style={styles.filterContainer}>
                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Фильтр по зоне</label>
                    <select
                        style={styles.filterSelect}
                        value={filterZone}
                        onChange={(e) => setFilterZone(e.target.value)}
                    >
                        <option value="">Все зоны</option>
                        {zones.map(zone => (
                            <option key={zone.id} value={zone.id}>{zone.name}</option>
                        ))}
                    </select>
                </div>
                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Фильтр по статусу</label>
                    <select
                        style={styles.filterSelect}
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">Все статусы</option>
                        {uniqueStatuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <button style={styles.resetBtn} onClick={resetFilters}>
                        Сбросить фильтры
                    </button>
                </div>
            </div>

            {showForm && (
                <div style={styles.formContainer}>
                    <h3>{isEditing ? 'Редактирование оборудования' : 'Новое оборудование'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Зона *</label>
                                <select
                                    value={formData.zoneId}
                                    onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
                                    required
                                    style={styles.select}
                                >
                                    <option value="">Выберите зону</option>
                                    {zones.map(zone => (
                                        <option key={zone.id} value={zone.id}>{zone.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Название оборудования *</label>
                                <input
                                    type="text"
                                    placeholder="Введите название"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    style={styles.input}
                                />
                            </div>
                        </div>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Статус</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    style={styles.select}
                                >
                                    <option value="Новое">Новое</option>
                                    <option value="В работе">В работе</option>
                                    <option value="Сломано">Сломано</option>
                                    <option value="На ремонте">На ремонте</option>
                                    <option value="Списано">Списано</option>
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Дата покупки *</label>
                                <input
                                    type="date"
                                    value={formData.dataBuy}
                                    onChange={(e) => setFormData({ ...formData, dataBuy: e.target.value })}
                                    required
                                    style={styles.input}
                                />
                            </div>
                        </div>
                        <div>
                            <button type="submit" style={styles.button}>
                                {isEditing ? 'Обновить' : 'Сохранить'}
                            </button>
                            <button type="button" style={styles.cancelBtn} onClick={resetForm}>
                                Отмена
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <p>Загрузка...</p>
            ) : (
                <>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Инв. номер</th>
                                <th style={styles.th}>Название</th>
                                <th style={styles.th}>Зона</th>
                                <th style={styles.th}>Статус</th>
                                <th style={styles.th}>Дата покупки</th>
                                <th style={styles.th}>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEquipment.map((item) => (
                                <tr key={item.id}>
                                    <td style={styles.td}>{item.id}</td>
                                    <td style={styles.td}>{item.name}</td>
                                    <td style={styles.td}>{getZoneName(item.zoneId)}</td>
                                    <td style={styles.td}>
                                        <span style={styles.statusBadge(item.status)}>{item.status}</span>
                                    </td>
                                    <td style={styles.td}>{item.dataBuy}</td>
                                    <td style={styles.td}>
                                        <button style={styles.editBtn} onClick={() => handleEdit(item)}>
                                            Изменить
                                        </button>
                                        <button style={styles.deleteBtn} onClick={() => handleDelete(item.id)}>
                                            Удалить
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={styles.countInfo}>
                        Показано: {filteredEquipment.length} из {equipment.length} единиц оборудования
                    </div>
                </>
            )}
        </div>
    );
};

export default EquipmentPage;