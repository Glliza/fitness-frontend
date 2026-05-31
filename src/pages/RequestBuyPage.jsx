import React, { useState, useEffect, useCallback } from 'react';
import { requestBuyService } from '../services/requestBuyService';
import { equipmentService } from '../services/equipmentService';
import { commonStyles } from '../styles/globalStyles';

const RequestBuyPage = () => {
    const [requests, setRequests] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    
    // Состояние для ошибок валидации
    const [validationErrors, setValidationErrors] = useState({});
    
    // Пагинация
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize] = useState(10);
    
    const [formData, setFormData] = useState({
        equipmentInventoryNumber: '',
        name: '',
        count: 1,
    });

    const statusOptions = ['В рассмотрении', 'Одобрена', 'Отклонена', 'Выполнена'];

    // Загрузка оборудования для выпадающего списка
    const loadEquipment = async () => {
        try {
            const response = await equipmentService.getAll(0, 100);
            setEquipment(response.data.content || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadRequests = useCallback(async (currentPage = page) => {
        try {
            setLoading(true);
            const response = await requestBuyService.getAll(currentPage, pageSize, 'createdAt', 'desc');
            setRequests(response.data.content);
            setTotalPages(response.data.totalPages);
            setTotalElements(response.data.totalElements);
            setPage(response.data.number);
            setError('');
        } catch (err) {
            setError('Ошибка загрузки заявок');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [pageSize]);

    useEffect(() => {
        loadEquipment();
        loadRequests(0);
    }, []);

    useEffect(() => {
        loadRequests(page);
    }, [page, loadRequests]);

    const handleCreate = async (e) => {
        e.preventDefault();
        setValidationErrors({});
        
        // Проверяем валидацию перед отправкой
        if (!formData.name || !formData.count) {
            setError('Заполните обязательные поля');
            return;
        }
        
        if (formData.name.length > 50) {
            setValidationErrors({ name: 'Наименование не может превышать 50 символов' });
            setError('Пожалуйста, исправьте ошибки в форме');
            return;
        }
        
        if (formData.count <= 0) {
            setValidationErrors({ count: 'Количество должно быть больше 0' });
            setError('Пожалуйста, исправьте ошибки в форме');
            return;
        }
        
        try {
            const dataToSend = {
                equipmentInventoryNumber: formData.equipmentInventoryNumber ? parseInt(formData.equipmentInventoryNumber) : null,
                name: formData.name,
                count: formData.count,
            };
            await requestBuyService.create(dataToSend);
            setShowForm(false);
            setFormData({ equipmentInventoryNumber: '', name: '', count: 1 });
            setValidationErrors({});
            await loadRequests(0);
            setPage(0);
            setSuccess('Заявка на закупку успешно создана');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            if (err.response?.status === 400 && err.response?.data?.errors) {
                setValidationErrors(err.response.data.errors);
                setError('Пожалуйста, исправьте ошибки в форме');
            } else {
                setError(err.response?.data?.message || 'Ошибка создания заявки');
            }
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        setUpdatingId(id);
        try {
            await requestBuyService.updateStatus(id, newStatus);
            await loadRequests(page);
            setSuccess(`Статус заявки изменён на "${newStatus}"`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Ошибка изменения статуса');
        } finally {
            setUpdatingId(null);
        }
    };

    const getEquipmentName = (invNumber) => {
        const eq = equipment.find(e => e.id === invNumber);
        return eq ? eq.name : 'Новое оборудование';
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'В рассмотрении': return '#ffc107';
            case 'Одобрена': return '#28a745';
            case 'Отклонена': return '#dc3545';
            case 'Выполнена': return '#17a2b8';
            default: return '#6c757d';
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setPage(newPage);
        }
    };

    const getInputStyle = (fieldName) => ({
        ...styles.input,
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
            <div style={commonStyles.pagination}>
                <button style={commonStyles.pageButton} onClick={() => handlePageChange(0)} disabled={page === 0}>⏮ Первая</button>
                <button style={commonStyles.pageButton} onClick={() => handlePageChange(page - 1)} disabled={page === 0}>◀ Назад</button>
                {startPage > 0 && <span style={commonStyles.pageInfo}>...</span>}
                {pages.map(p => (
                    <button key={p} style={p === page ? commonStyles.activePageButton : commonStyles.pageButton} onClick={() => handlePageChange(p)}>
                        {p + 1}
                    </button>
                ))}
                {endPage < totalPages - 1 && <span style={commonStyles.pageInfo}>...</span>}
                <button style={commonStyles.pageButton} onClick={() => handlePageChange(page + 1)} disabled={page === totalPages - 1}>Вперед ▶</button>
                <button style={commonStyles.pageButton} onClick={() => handlePageChange(totalPages - 1)} disabled={page === totalPages - 1}>Последняя ⏩</button>
                <span style={commonStyles.pageInfo}>Страница {page + 1} из {totalPages} (всего {totalElements})</span>
            </div>
        );
    };

    const styles = {
        ...commonStyles,
        statusSelect: { 
            padding: '0.25rem 0.5rem', 
            borderRadius: '4px', 
            border: '1px solid #ccc', 
            cursor: 'pointer',
            minWidth: '130px',
            fontSize: '0.875rem'
        },
        statusBadge: (status) => ({
            display: 'inline-block',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            backgroundColor: getStatusColor(status),
            color: 'white',
        }),
        tdWithWrap: {
            padding: '12px',
            borderBottom: '1px solid #dee2e6',
            textAlign: 'left',
            wordWrap: 'break-word',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            maxWidth: '300px',
            minWidth: '150px'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Заявки на закупку</h1>
                <button style={styles.button} onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Отмена' : '+ Новая заявка'}
                </button>
            </div>

            {error && <div style={styles.error}>{error}</div>}
            {success && <div style={styles.success}>{success}</div>}

            {/* Форма создания заявки */}
            {showForm && (
                <div style={styles.formContainer}>
                    <h3>Новая заявка на закупку</h3>
                    <form onSubmit={handleCreate}>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Оборудование</label>
                                <select 
                                    style={styles.select} 
                                    value={formData.equipmentInventoryNumber} 
                                    onChange={(e) => setFormData({...formData, equipmentInventoryNumber: e.target.value ? parseInt(e.target.value) : ''})}
                                >
                                    <option value="">Новое оборудование (не в системе)</option>
                                    {equipment.map(eq => (
                                        <option key={eq.id} value={eq.id}>{eq.name} (№{eq.id})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Наименование для закупки *</label>
                                <input 
                                    type="text" 
                                    placeholder="Введите наименование (2-50 символов)"
                                    style={getInputStyle('name')}
                                    value={formData.name} 
                                    onChange={(e) => {
                                        if (e.target.value.length <= 50) {
                                            setFormData({...formData, name: e.target.value});
                                            setValidationErrors({...validationErrors, name: ''});
                                        } else {
                                            setValidationErrors({...validationErrors, name: 'Наименование не может превышать 50 символов'});
                                        }
                                    }}
                                    required 
                                />
                                {validationErrors.name && <div style={getErrorStyle()}>{validationErrors.name}</div>}
                                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                                    {formData.name.length}/50 символов
                                </div>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Количество *</label>
                                <input 
                                    type="number" 
                                    style={getInputStyle('count')}
                                    value={formData.count} 
                                    onChange={(e) => setFormData({...formData, count: parseInt(e.target.value) || 1})} 
                                    min="1" 
                                    required 
                                />
                                {validationErrors.count && <div style={getErrorStyle()}>{validationErrors.count}</div>}
                            </div>
                        </div>
                        <button type="submit" style={styles.button}>Создать</button>
                    </form>
                </div>
            )}

            {/* Таблица заявок */}
            {loading ? (
                <p>Загрузка...</p>
            ) : (
                <>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>ID</th>
                                    <th style={styles.th}>Оборудование</th>
                                    <th style={styles.th}>Наименование</th>
                                    <th style={styles.th}>Количество</th>
                                    <th style={styles.th}>Дата создания</th>
                                    <th style={styles.th}>Статус</th>
                                    <th style={styles.th}>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(req => (
                                    <tr key={req.id}>
                                        <td style={styles.td}>{req.id}</td>
                                        <td style={styles.td}>
                                            {req.equipmentInventoryNumber ? getEquipmentName(req.equipmentInventoryNumber) : 'Новое'}
                                            {req.equipmentInventoryNumber && ` (№${req.equipmentInventoryNumber})`}
                                        </td>
                                        <td style={styles.tdWithWrap}>
                                            <div style={{ 
                                                maxWidth: '300px', 
                                                wordWrap: 'break-word', 
                                                whiteSpace: 'normal',
                                                wordBreak: 'break-all',
                                                lineHeight: '1.4'
                                            }}>
                                                {req.name}
                                            </div>
                                        </td>
                                        <td style={styles.td}>{req.count}</td>
                                        <td style={styles.td}>{req.created_at}</td>
                                        <td style={styles.td}>
                                            <span style={styles.statusBadge(req.status)}>{req.status}</span>
                                        </td>
                                        <td style={styles.td}>
                                            <select
                                                style={styles.statusSelect}
                                                value={req.status}
                                                onChange={(e) => handleUpdateStatus(req.id, e.target.value)}
                                                disabled={updatingId === req.id}
                                            >
                                                {statusOptions.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                            {updatingId === req.id && <span> ⏳</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {renderPagination()}
                </>
            )}
        </div>
    );
};

export default RequestBuyPage;