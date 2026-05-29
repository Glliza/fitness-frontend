import React, { useState, useEffect, useCallback } from 'react';
import { equipmentService } from '../services/equipmentService';
import { zoneService } from '../services/zoneService';
import { commonStyles } from '../styles/globalStyles';

const EquipmentPage = () => {
    const [equipment, setEquipment] = useState([]);
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    // Фильтры
    const [filterZone, setFilterZone] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    
    // Пагинация
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize] = useState(10);
    
    const [formData, setFormData] = useState({
        zoneId: '',
        name: '',
        status: 'Новое',
        dataBuy: '',
    });

    // Загрузка всех зон (без пагинации для фильтра)
    const loadAllZones = async () => {
        try {
            const response = await zoneService.getAll(0, 100);
            setZones(response.data.content || []);
        } catch (err) {
            console.error('Ошибка загрузки зон:', err);
        }
    };

    // Функция загрузки оборудования с текущими фильтрами
    const loadEquipment = useCallback(async (currentPage = 0, zone = filterZone, status = filterStatus) => {
        try {
            setLoading(true);
            console.log('Загрузка с фильтрами:', { zone, status, page: currentPage });
            const response = await equipmentService.getAll(
                currentPage, pageSize, 'id', 'asc',
                zone || null,
                status || null
            );
            setEquipment(response.data.content);
            setTotalPages(response.data.totalPages);
            setTotalElements(response.data.totalElements);
            setPage(response.data.number);
            setError('');
        } catch (err) {
            setError('Ошибка загрузки оборудования');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filterZone, filterStatus, pageSize]);

    // При изменении фильтров или страницы - загружаем данные
    useEffect(() => {
        loadEquipment(page, filterZone, filterStatus);
    }, [page, filterZone, filterStatus, loadEquipment]);

    // Применение фильтров (сброс на первую страницу)
    const applyFilters = () => {
        setPage(0);
        // loadEquipment вызовется через useEffect
    };

    // Сброс фильтров
    const resetFilters = () => {
        setFilterZone('');
        setFilterStatus('');
        setPage(0);
    };

    useEffect(() => {
        loadAllZones();
    }, []);

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
            // Перезагружаем текущую страницу с фильтрами
            loadEquipment(page, filterZone, filterStatus);
        } catch (err) {
            setError(isEditing ? 'Ошибка обновления оборудования' : 'Ошибка создания оборудования');
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Удалить оборудование?')) {
            try {
                await equipmentService.delete(id);
                loadEquipment(page, filterZone, filterStatus);
            } catch (err) {
                setError(err.response?.data?.message || 'Ошибка удаления');
            }
        }
    };

    const getZoneName = (zoneId) => {
        if (!zoneId) return 'Не указана';
        const zone = zones.find(z => z.id === zoneId);
        return zone ? zone.name : 'Неизвестная зона';
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setPage(newPage);
        }
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null;
        
        const pages = [];
        const maxVisible = 5;
        let startPage = Math.max(0, page - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(0, endPage - maxVisible + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        
        return (
            <div style={commonStyles.pagination}>
                <button
                    style={commonStyles.pageButton}
                    onClick={() => handlePageChange(0)}
                    disabled={page === 0}
                >
                    ⏮ Первая
                </button>
                <button
                    style={commonStyles.pageButton}
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 0}
                >
                    ◀ Назад
                </button>
                
                {startPage > 0 && <span style={commonStyles.pageInfo}>...</span>}
                
                {pages.map(p => (
                    <button
                        key={p}
                        style={p === page ? commonStyles.activePageButton : commonStyles.pageButton}
                        onClick={() => handlePageChange(p)}
                    >
                        {p + 1}
                    </button>
                ))}
                
                {endPage < totalPages - 1 && <span style={commonStyles.pageInfo}>...</span>}
                
                <button
                    style={commonStyles.pageButton}
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages - 1}
                >
                    Вперед ▶
                </button>
                <button
                    style={commonStyles.pageButton}
                    onClick={() => handlePageChange(totalPages - 1)}
                    disabled={page === totalPages - 1}
                >
                    Последняя ⏩
                </button>
                
                <span style={commonStyles.pageInfo}>
                    Страница {page + 1} из {totalPages} (всего {totalElements} записей)
                </span>
            </div>
        );
    };

    // Объединяем стили
    const styles = {
        ...commonStyles,
        filterContainer: {
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-end',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
        },
        filterGroup: { flex: 1, minWidth: '150px' },
        filterLabel: { display: 'block', marginBottom: '0.25rem', fontWeight: 'bold', fontSize: '0.875rem' },
        filterSelect: { width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' },
        resetBtn: { backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', height: '38px' },
        statusBadge: (status) => ({
            display: 'inline-block',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.875rem',
            backgroundColor: status === 'Списано' ? '#dc3545' : status === 'На ремонте' ? '#ffc107' : status === 'Сломано' ? '#fd7e14' : '#28a745',
            color: 'white',
        }),
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Управление оборудованием</h1>
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
                        onChange={(e) => {
                            setFilterZone(e.target.value);
                            setPage(0);
                        }}
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
                        onChange={(e) => {
                            setFilterStatus(e.target.value);
                            setPage(0);
                        }}
                    >
                        <option value="">Все статусы</option>
                        <option value="Новое">Новое</option>
                        <option value="В работе">В работе</option>
                        <option value="Сломано">Сломано</option>
                        <option value="На ремонте">На ремонте</option>
                        <option value="Списано">Списано</option>
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
                            {equipment.map((item) => (
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
                    
                    {renderPagination()}
                    
                    <div style={styles.countInfo}>
                        Всего: {totalElements} единиц оборудования
                    </div>
                </>
            )}
        </div>
    );
};

export default EquipmentPage;