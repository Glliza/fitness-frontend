import React, { useState, useEffect } from 'react';
import { zoneService } from '../services/zoneService';
import { commonStyles } from '../styles/globalStyles';

const ZonesPage = () => {
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    // Состояние для ошибок валидации полей
    const [validationErrors, setValidationErrors] = useState({});
    
    // Пагинация
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
        setValidationErrors({}); // Очищаем ошибки валидации
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
        setValidationErrors({}); // Очищаем ошибки валидации
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidationErrors({}); // Сбрасываем предыдущие ошибки
        
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
            // Проверяем, есть ли детальные ошибки валидации от бэкенда
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

    // Функция для получения стиля поля с ошибкой
    const getInputStyle = (fieldName) => ({
        ...styles.input,
        borderColor: validationErrors[fieldName] ? '#dc3545' : '#ccc',
    });

    // Функция для получения стиля сообщения об ошибке
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
        button: { ...commonStyles.button, marginRight: '0.5rem' },
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Управление зонами</h1>
                {!showForm && (
                    <button style={styles.button} onClick={() => setShowForm(true)}>
                        + Добавить зону
                    </button>
                )}
            </div>

            {error && <div style={styles.error}>{error}</div>}

            {showForm && (
                <div style={styles.formContainer}>
                    <h3>{isEditing ? 'Редактирование зоны' : 'Новая зона'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Название *</label>
                                <input
                                    type="text"
                                    placeholder="Введите название (2-50 символов)"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    style={getInputStyle('name')}
                                />
                                {validationErrors.name && (
                                    <div style={getErrorStyle()}>⚠️ {validationErrors.name}</div>
                                )}
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Описание</label>
                                <input
                                    type="text"
                                    placeholder="Введите описание (не более 100 символов)"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    style={getInputStyle('description')}
                                />
                                {validationErrors.description && (
                                    <div style={getErrorStyle()}>⚠️ {validationErrors.description}</div>
                                )}
                            </div>
                        </div>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Вместимость *</label>
                                <input
                                    type="number"
                                    placeholder="Введите вместимость (больше 0)"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                    required
                                    style={getInputStyle('capacity')}
                                />
                                {validationErrors.capacity && (
                                    <div style={getErrorStyle()}>⚠️ {validationErrors.capacity}</div>
                                )}
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Этаж *</label>
                                <input
                                    type="number"
                                    placeholder="Введите этаж (не может быть отрицательным)"
                                    value={formData.floor}
                                    onChange={(e) => setFormData({ ...formData, floor: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                    required
                                    style={getInputStyle('floor')}
                                />
                                {validationErrors.floor && (
                                    <div style={getErrorStyle()}>⚠️ {validationErrors.floor}</div>
                                )}
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
                                <th style={styles.th}>ID</th>
                                <th style={styles.th}>Название</th>
                                <th style={styles.th}>Описание</th>
                                <th style={styles.th}>Вместимость</th>
                                <th style={styles.th}>Этаж</th>
                                <th style={styles.th}>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {zones.map((zone) => (
                                <tr key={zone.id}>
                                    <td style={styles.td}>{zone.id}</td>
                                    <td style={styles.td}>{zone.name}</td>
                                    <td style={styles.td}>{zone.description || '-'}</td>
                                    <td style={styles.td}>{zone.capacity}</td>
                                    <td style={styles.td}>{zone.floor}</td>
                                    <td style={styles.td}>
                                        <button style={styles.editBtn} onClick={() => handleEdit(zone)}>
                                            Изменить
                                        </button>
                                        <button style={styles.deleteBtn} onClick={() => handleDelete(zone.id)}>
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