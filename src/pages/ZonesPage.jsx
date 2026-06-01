import React, { useState, useEffect } from 'react';
import { zoneService } from '../services/zoneService';
import './ZonesPage.css';

const ZonesPage = () => {
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    const [validationErrors, setValidationErrors] = useState({});
    
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize] = useState(10);
    
    const [formData, setFormData] = useState({
        userid: 1,
        name: '',
        description: '',
        capacity: '',
        floor: '',
    });

    const loadZones = async (currentPage = page) => {
        try {
            setLoading(true);
            const response = await zoneService.getAll(currentPage, pageSize, 'id', 'asc');
            setZones(response.data.content);
            setTotalPages(response.data.totalPages);
            setTotalElements(response.data.totalElements);
            setPage(response.data.number);
            setError('');
        } catch (err) {
            setError('Ошибка загрузки зон');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadZones(0);
    }, []);

    const resetForm = () => {
        setFormData({
            userid: 1,
            name: '',
            description: '',
            capacity: '',
            floor: '',
        });
        setIsEditing(false);
        setEditingId(null);
        setShowForm(false);
        setValidationErrors({});
    };

    const handleEdit = (zone) => {
        setFormData({
            userid: zone.userid || 1,
            name: zone.name,
            description: zone.description || '',
            capacity: zone.capacity,
            floor: zone.floor,
        });
        setIsEditing(true);
        setEditingId(zone.id);
        setShowForm(true);
        setValidationErrors({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidationErrors({});
        
        try {
            if (isEditing) {
                await zoneService.update(editingId, formData);
            } else {
                await zoneService.create(formData);
            }
            resetForm();
            loadZones(page);
            setError('');
        } catch (err) {
            if (err.response?.status === 400 && err.response?.data?.errors) {
                setValidationErrors(err.response.data.errors);
                setError('Пожалуйста, исправьте ошибки в форме');
            } else {
                setError(err.response?.data?.message || (isEditing ? 'Ошибка обновления зоны' : 'Ошибка создания зоны'));
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Удалить зону?')) {
            try {
                await zoneService.delete(id);
                loadZones(page);
            } catch (err) {
                setError(err.response?.data?.message || 'Ошибка удаления');
            }
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            loadZones(newPage);
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
            <div className="zones-pagination">
                <button className="zones-page-button" onClick={() => handlePageChange(0)} disabled={page === 0}>
                    ⏮ Первая
                </button>
                <button className="zones-page-button" onClick={() => handlePageChange(page - 1)} disabled={page === 0}>
                    ◀ Назад
                </button>
                {startPage > 0 && <span className="zones-page-info">...</span>}
                {pages.map(p => (
                    <button key={p} className={p === page ? "zones-active-page-button" : "zones-page-button"} onClick={() => handlePageChange(p)}>
                        {p + 1}
                    </button>
                ))}
                {endPage < totalPages - 1 && <span className="zones-page-info">...</span>}
                <button className="zones-page-button" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages - 1}>
                    Вперед ▶
                </button>
                <button className="zones-page-button" onClick={() => handlePageChange(totalPages - 1)} disabled={page === totalPages - 1}>
                    Последняя ⏩
                </button>
                <span className="zones-page-info">
                    Страница {page + 1} из {totalPages} (всего {totalElements} записей)
                </span>
            </div>
        );
    };

    return (
        <div className="zones-container">
            <div className="zones-header">
                <h1 className="zones-title">Управление зонами</h1>
                {!showForm && (
                    <button className="zones-button" onClick={() => setShowForm(true)}>
                        + Добавить зону
                    </button>
                )}
            </div>

            {error && <div className="zones-error">{error}</div>}

            {showForm && (
                <div className="zones-form-container">
                    <h3>{isEditing ? 'Редактирование зоны' : 'Новая зона'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="zones-form-row">
                            <div className="zones-form-group">
                                <label className="zones-label">Название *</label>
                                <input
                                    type="text"
                                    placeholder="Введите название (2-50 символов)"
                                    className="zones-input"
                                    style={getInputStyle('name')}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                                {validationErrors.name && (
                                    <div className="zones-validation-error">{validationErrors.name}</div>
                                )}
                            </div>
                            <div className="zones-form-group">
                                <label className="zones-label">Описание</label>
                                <input
                                    type="text"
                                    placeholder="Введите описание (не более 100 символов)"
                                    className="zones-input"
                                    style={getInputStyle('description')}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                                {validationErrors.description && (
                                    <div className="zones-validation-error">{validationErrors.description}</div>
                                )}
                            </div>
                        </div>
                        <div className="zones-form-row">
                            <div className="zones-form-group">
                                <label className="zones-label">Вместимость *</label>
                                <input
                                    type="number"
                                    placeholder="Введите вместимость (больше 0)"
                                    className="zones-input"
                                    style={getInputStyle('capacity')}
                                    value={formData.capacity}
                                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                    required
                                />
                                {validationErrors.capacity && (
                                    <div className="zones-validation-error">{validationErrors.capacity}</div>
                                )}
                            </div>
                            <div className="zones-form-group">
                                <label className="zones-label">Этаж *</label>
                                <input
                                    type="number"
                                    placeholder="Введите этаж (не может быть отрицательным)"
                                    className="zones-input"
                                    style={getInputStyle('floor')}
                                    value={formData.floor}
                                    onChange={(e) => setFormData({ ...formData, floor: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                    required
                                />
                                {validationErrors.floor && (
                                    <div className="zones-validation-error">{validationErrors.floor}</div>
                                )}
                            </div>
                        </div>
                        <div>
                            <button type="submit" className="zones-button">
                                {isEditing ? 'Обновить' : 'Сохранить'}
                            </button>
                            <button type="button" className="zones-cancel-btn" onClick={resetForm}>
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
                    <table className="zones-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Название</th>
                                <th>Описание</th>
                                <th>Вместимость</th>
                                <th>Этаж</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {zones.map((zone) => (
                                <tr key={zone.id}>
                                    <td>{zone.id}</td>
                                    <td>{zone.name}</td>
                                    <td>{zone.description || '-'}</td>
                                    <td>{zone.capacity}</td>
                                    <td>{zone.floor}</td>
                                    <td>
                                        <button className="zones-edit-btn" onClick={() => handleEdit(zone)}>
                                            Изменить
                                        </button>
                                        <button className="zones-delete-btn" onClick={() => handleDelete(zone.id)}>
                                            Удалить
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {totalPages > 1 && renderPagination()}
                </>
            )}
        </div>
    );
};

export default ZonesPage;