import React, { useState, useEffect, useCallback } from 'react';
import { equipmentService } from '../services/equipmentService';
import { zoneService } from '../services/zoneService';
import './EquipmentPage.css';

const EquipmentPage = () => {
    const [equipment, setEquipment] = useState([]);
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    const [validationErrors, setValidationErrors] = useState({});
    
    const [filterZone, setFilterZone] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    
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

    const loadAllZones = async () => {
        try {
            const response = await zoneService.getAll(0, 100);
            setZones(response.data.content || []);
        } catch (err) {
            console.error('Ошибка загрузки зон:', err);
        }
    };

    const loadEquipment = useCallback(async (currentPage = 0, zone = filterZone, status = filterStatus) => {
        try {
            setLoading(true);
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

    useEffect(() => {
        loadEquipment(page, filterZone, filterStatus);
    }, [page, filterZone, filterStatus, loadEquipment]);

    const applyFilters = () => {
        setPage(0);
    };

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
        setValidationErrors({});
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
        setValidationErrors({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidationErrors({});
    
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
            loadEquipment(page, filterZone, filterStatus);
            setError('');
        } catch (err) {
            if (err.response?.status === 400 && err.response?.data?.errors) {
                setValidationErrors(err.response.data.errors);
                setError('Пожалуйста, исправьте ошибки в форме');
            } else {
                setError(err.response?.data?.message || (isEditing ? 'Ошибка обновления оборудования' : 'Ошибка создания оборудования'));
            }
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

    const getInputStyle = (fieldName) => ({
        borderColor: validationErrors[fieldName] ? '#dc3545' : '#ccc',
    });

    const getErrorStyle = () => ({
        color: '#dc3545',
        fontSize: '0.75rem',
        marginTop: '0.25rem',
    });

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
            <div className="equipment-pagination">
                <button className="equipment-page-button" onClick={() => handlePageChange(0)} disabled={page === 0}>
                    ⏮ Первая
                </button>
                <button className="equipment-page-button" onClick={() => handlePageChange(page - 1)} disabled={page === 0}>
                    ◀ Назад
                </button>
                {startPage > 0 && <span className="equipment-page-info">...</span>}
                {pages.map(p => (
                    <button key={p} className={p === page ? "equipment-active-page-button" : "equipment-page-button"} onClick={() => handlePageChange(p)}>
                        {p + 1}
                    </button>
                ))}
                {endPage < totalPages - 1 && <span className="equipment-page-info">...</span>}
                <button className="equipment-page-button" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages - 1}>
                    Вперед ▶
                </button>
                <button className="equipment-page-button" onClick={() => handlePageChange(totalPages - 1)} disabled={page === totalPages - 1}>
                    Последняя ⏩
                </button>
                <span className="equipment-page-info">
                    Страница {page + 1} из {totalPages} (всего {totalElements} записей)
                </span>
            </div>
        );
    };

    const getStatusBadgeClass = (status) => {
    switch(status) {
        case 'Списано':
            return 'equipment-status-badge equipment-status-badge-spisano';
        case 'На ремонте':
            return 'equipment-status-badge equipment-status-badge-remont';
        case 'Сломано':
            return 'equipment-status-badge equipment-status-badge-slomano';
        case 'Новое':
            return 'equipment-status-badge equipment-status-badge-novoe';
        case 'В работе':
            return 'equipment-status-badge equipment-status-badge-work';
        default:
            return 'equipment-status-badge';
    }
};

    return (
        <div className="equipment-container">
            <div className="equipment-header">
                <h1 className="equipment-title">Управление оборудованием</h1>
                {!showForm && (
                    <button className="equipment-button" onClick={() => setShowForm(true)}>
                        + Добавить оборудование
                    </button>
                )}
            </div>

            {error && <div className="equipment-error">{error}</div>}

            <div className="equipment-filter-container">
                <div className="equipment-filter-group">
                    <label className="equipment-filter-label">Фильтр по зоне</label>
                    <select
                        className="equipment-filter-select"
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
                <div className="equipment-filter-group">
                    <label className="equipment-filter-label">Фильтр по статусу</label>
                    <select
                        className="equipment-filter-select"
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
                    <button className="equipment-reset-btn" onClick={resetFilters}>
                        Сбросить фильтры
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="equipment-form-container">
                    <h3>{isEditing ? 'Редактирование оборудования' : 'Новое оборудование'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="equipment-form-row">
                            <div className="equipment-form-group">
                                <label className="equipment-label">Зона *</label>
                                <select
                                    className="equipment-select"
                                    style={getInputStyle('zoneId')}
                                    value={formData.zoneId}
                                    onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
                                    required
                                >
                                    <option value="">Выберите зону</option>
                                    {zones.map(zone => (
                                        <option key={zone.id} value={zone.id}>{zone.name}</option>
                                    ))}
                                </select>
                                {validationErrors.zoneId && (
                                    <div className="equipment-validation-error">{validationErrors.zoneId}</div>
                                )}
                            </div>
                            <div className="equipment-form-group">
                                <label className="equipment-label">Название оборудования *</label>
                                <input
                                    type="text"
                                    placeholder="Введите название (2-50 символов)"
                                    className="equipment-input"
                                    style={getInputStyle('name')}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                                {validationErrors.name && (
                                    <div className="equipment-validation-error">{validationErrors.name}</div>
                                )}
                            </div>
                        </div>
                        <div className="equipment-form-row">
                            <div className="equipment-form-group">
                                <label className="equipment-label">Статус</label>
                                <select
                                    className="equipment-select"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Новое">Новое</option>
                                    <option value="В работе">В работе</option>
                                    <option value="Сломано">Сломано</option>
                                    <option value="На ремонте">На ремонте</option>
                                    <option value="Списано">Списано</option>
                                </select>
                            </div>
                            <div className="equipment-form-group">
                                <label className="equipment-label">Дата покупки *</label>
                                <input
                                    type="date"
                                    className="equipment-input"
                                    style={getInputStyle('dataBuy')}
                                    value={formData.dataBuy}
                                    onChange={(e) => setFormData({ ...formData, dataBuy: e.target.value })}
                                    required
                                />
                                {validationErrors.dataBuy && (
                                    <div className="equipment-validation-error">{validationErrors.dataBuy}</div>
                                )}
                            </div>
                        </div>
                        <div>
                            <button type="submit" className="equipment-button">
                                {isEditing ? 'Обновить' : 'Сохранить'}
                            </button>
                            <button type="button" className="equipment-cancel-btn" onClick={resetForm}>
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
                    <table className="equipment-table">
                        <thead>
                            <tr>
                                <th>Инв. номер</th>
                                <th>Название</th>
                                <th>Зона</th>
                                <th>Статус</th>
                                <th>Дата покупки</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {equipment.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.id}</td>
                                    <td>{item.name}</td>
                                    <td>{getZoneName(item.zoneId)}</td>
                                    <td>
                                        <span className={getStatusBadgeClass(item.status)}>{item.status}</span>
                                    </td>
                                    <td>{item.dataBuy}</td>
                                    <td>
                                        <button className="equipment-edit-btn" onClick={() => handleEdit(item)}>
                                            Изменить
                                        </button>
                                        <button className="equipment-delete-btn" onClick={() => handleDelete(item.id)}>
                                            Удалить
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {renderPagination()}
                    
                    <div className="equipment-count-info">
                        Всего: {totalElements} единиц оборудования
                    </div>
                </>
            )}
        </div>
    );
};

export default EquipmentPage;