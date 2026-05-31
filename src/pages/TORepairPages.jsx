import React, { useState, useEffect, useCallback } from 'react';
import { maintenanceService } from '../services/maintenanceService';
import { equipmentService } from '../services/equipmentService';
import { commonStyles } from '../styles/globalStyles';

const TORepairPages = () => {
    const [toRepairs, setToRepairs] = useState([]);
    const [requests, setRequests] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('to');
    const [showForm, setShowForm] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    
    const [validationErrors, setValidationErrors] = useState({});
    const [repairValidationErrors, setRepairValidationErrors] = useState({});
    
    const [toPage, setToPage] = useState(0);
    const [toTotalPages, setToTotalPages] = useState(0);
    const [toTotalElements, setToTotalElements] = useState(0);
    const [toPageSize] = useState(10);
    
    const [reqPage, setReqPage] = useState(0);
    const [reqTotalPages, setReqTotalPages] = useState(0);
    const [reqTotalElements, setReqTotalElements] = useState(0);
    const [reqPageSize] = useState(10);
    
    const [formData, setFormData] = useState({
        equipmentId: '',
        type: '',
        plannedDate: '',
        description: '',
        worker: '',
    });
    
    const [repairForm, setRepairForm] = useState({
        equipmentInventoryNumber: '',
        creator: '',
        description: '',
    });

    const statusOptions = ['Открыта', 'В работе', 'Выполнена'];

    const loadEquipment = async () => {
        try {
            const response = await equipmentService.getAll(0, 100);
            setEquipment(response.data.content || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadToRepairs = useCallback(async (page = toPage) => {
        try {
            const response = await maintenanceService.getAllTO(page, toPageSize, 'plannedDate', 'desc');
            setToRepairs(response.data.content);
            setToTotalPages(response.data.totalPages);
            setToTotalElements(response.data.totalElements);
            setToPage(response.data.number);
        } catch (err) {
            console.error(err);
        }
    }, [toPageSize]);

    const loadRequests = useCallback(async (page = reqPage) => {
        try {
            const response = await maintenanceService.getAllRequests(page, reqPageSize, 'createdAt', 'desc');
            setRequests(response.data.content);
            setReqTotalPages(response.data.totalPages);
            setReqTotalElements(response.data.totalElements);
            setReqPage(response.data.number);
        } catch (err) {
            console.error(err);
        }
    }, [reqPageSize]);

    const loadData = async () => {
        setLoading(true);
        try {
            await loadEquipment();
            await loadToRepairs(0);
            await loadRequests(0);
            setError('');
            setSuccess('');
        } catch (err) {
            setError('Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (activeTab === 'to') {
            loadToRepairs(toPage);
        }
    }, [toPage, activeTab, loadToRepairs]);

    useEffect(() => {
        if (activeTab === 'requests') {
            loadRequests(reqPage);
        }
    }, [reqPage, activeTab, loadRequests]);

    const resetForm = () => {
        setFormData({
            equipmentId: '',
            type: '',
            plannedDate: '',
            description: '',
            worker: '',
        });
        setValidationErrors({});
    };

    const resetRepairForm = () => {
        setRepairForm({
            equipmentInventoryNumber: '',
            creator: '',
            description: '',
        });
        setRepairValidationErrors({});
    };

    const handleCreateTO = async (e) => {
        e.preventDefault();
        setValidationErrors({});
        
        if (!formData.equipmentId || !formData.type || !formData.plannedDate) {
            setError('Заполните обязательные поля');
            return;
        }
        try {
            const dataToSend = {
                equipmentId: parseInt(formData.equipmentId),
                type: formData.type,
                plannedDate: formData.plannedDate,
                description: formData.description || '',
                worker: formData.worker || ''
            };
            await maintenanceService.createTO(dataToSend);
            setShowForm(false);
            resetForm();
            await loadToRepairs(0);
            setToPage(0);
            setSuccess('Плановое ТО успешно создано');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            if (err.response?.status === 400 && err.response?.data?.errors) {
                setValidationErrors(err.response.data.errors);
                setError('Пожалуйста, исправьте ошибки в форме');
            } else {
                setError(err.response?.data?.message || 'Ошибка создания ТО');
            }
        }
    };

    const handleCreateRepair = async (e) => {
        e.preventDefault();
        setRepairValidationErrors({});
        
        if (!repairForm.equipmentInventoryNumber || !repairForm.creator) {
            setError('Заполните обязательные поля');
            return;
        }
        try {
            const dataToSend = {
                equipmentInventoryNumber: parseInt(repairForm.equipmentInventoryNumber),
                creator: repairForm.creator,
                description: repairForm.description || '',
                tORepairId: null
            };
            await maintenanceService.createRepair(dataToSend);
            setShowForm(false);
            resetRepairForm();
            await loadRequests(0);
            setReqPage(0);
            if (repairForm.equipmentInventoryNumber) {
                await equipmentService.changeStatus(repairForm.equipmentInventoryNumber, 'Сломано');
            }
            setSuccess('Заявка на ремонт успешно создана');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            if (err.response?.status === 400 && err.response?.data?.errors) {
                setRepairValidationErrors(err.response.data.errors);
                setError('Пожалуйста, исправьте ошибки в форме');
            } else {
                setError(err.response?.data?.message || 'Ошибка создания заявки');
            }
        }
    };

    const handleCompleteTO = async (toId, equipmentId) => {
        setUpdatingId(toId);
        try {
            await maintenanceService.completeTO(toId);
            await loadToRepairs(toPage);
            const nextDateRes = await maintenanceService.getNextTODate(equipmentId);
            setSuccess(`ТО завершено. Следующее ТО запланировано на ${nextDateRes.data}`);
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setError('Ошибка завершения ТО');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleUpdateRequestStatus = async (requestId, newStatus) => {
        setUpdatingId(requestId);
        try {
            await maintenanceService.updateRequestStatus(requestId, newStatus, 'Система');
            await loadRequests(reqPage);
            setSuccess(`Статус заявки изменён на "${newStatus}"`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Ошибка изменения статуса');
        } finally {
            setUpdatingId(null);
        }
    };

    const getEquipmentName = (equipmentId) => {
        const eq = equipment.find(e => e.id === equipmentId);
        return eq ? eq.name : 'Неизвестно';
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'Открыта': return '#ffc107';
            case 'В работе': return '#17a2b8';
            case 'Выполнена': return '#28a745';
            case 'Запланировано': return '#6c757d';
            default: return '#6c757d';
        }
    };

    const getInputStyle = (fieldName) => ({
        ...styles.input,
        borderColor: validationErrors[fieldName] ? '#dc3545' : '#ccc',
    });

    const getRepairInputStyle = (fieldName) => ({
        ...styles.input,
        borderColor: repairValidationErrors[fieldName] ? '#dc3545' : '#ccc',
    });

    const getErrorStyle = () => ({
        color: '#dc3545',
        fontSize: '0.75rem',
        marginTop: '0.25rem',
    });

    const renderTOPagination = () => {
        if (toTotalPages <= 1) return null;
        
        const pages = [];
        const maxVisible = 5;
        let startPage = Math.max(0, toPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(toTotalPages - 1, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(0, endPage - maxVisible + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        
        return (
            <div style={commonStyles.pagination}>
                <button style={commonStyles.pageButton} onClick={() => setToPage(0)} disabled={toPage === 0}>⏮ Первая</button>
                <button style={commonStyles.pageButton} onClick={() => setToPage(toPage - 1)} disabled={toPage === 0}>◀ Назад</button>
                {startPage > 0 && <span style={commonStyles.pageInfo}>...</span>}
                {pages.map(p => (
                    <button key={p} style={p === toPage ? commonStyles.activePageButton : commonStyles.pageButton} onClick={() => setToPage(p)}>
                        {p + 1}
                    </button>
                ))}
                {endPage < toTotalPages - 1 && <span style={commonStyles.pageInfo}>...</span>}
                <button style={commonStyles.pageButton} onClick={() => setToPage(toPage + 1)} disabled={toPage === toTotalPages - 1}>Вперед ▶</button>
                <button style={commonStyles.pageButton} onClick={() => setToPage(toTotalPages - 1)} disabled={toPage === toTotalPages - 1}>Последняя ⏩</button>
                <span style={commonStyles.pageInfo}>Страница {toPage + 1} из {toTotalPages} (всего {toTotalElements})</span>
            </div>
        );
    };

    const renderReqPagination = () => {
        if (reqTotalPages <= 1) return null;
        
        const pages = [];
        const maxVisible = 5;
        let startPage = Math.max(0, reqPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(reqTotalPages - 1, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(0, endPage - maxVisible + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        
        return (
            <div style={commonStyles.pagination}>
                <button style={commonStyles.pageButton} onClick={() => setReqPage(0)} disabled={reqPage === 0}>⏮ Первая</button>
                <button style={commonStyles.pageButton} onClick={() => setReqPage(reqPage - 1)} disabled={reqPage === 0}>◀ Назад</button>
                {startPage > 0 && <span style={commonStyles.pageInfo}>...</span>}
                {pages.map(p => (
                    <button key={p} style={p === reqPage ? commonStyles.activePageButton : commonStyles.pageButton} onClick={() => setReqPage(p)}>
                        {p + 1}
                    </button>
                ))}
                {endPage < reqTotalPages - 1 && <span style={commonStyles.pageInfo}>...</span>}
                <button style={commonStyles.pageButton} onClick={() => setReqPage(reqPage + 1)} disabled={reqPage === reqTotalPages - 1}>Вперед ▶</button>
                <button style={commonStyles.pageButton} onClick={() => setReqPage(reqTotalPages - 1)} disabled={reqPage === reqTotalPages - 1}>Последняя ⏩</button>
                <span style={commonStyles.pageInfo}>Страница {reqPage + 1} из {reqTotalPages} (всего {reqTotalElements})</span>
            </div>
        );
    };

    const styles = {
        ...commonStyles,
        completeBtn: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' },
        statusSelect: { padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer', minWidth: '120px', fontSize: '0.875rem' },
        statusBadge: (status) => ({
            display: 'inline-block',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.875rem',
            backgroundColor: getStatusColor(status),
            color: 'white',
        }),
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Техническое обслуживание и ремонты</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button style={{...styles.button, ...(activeTab === 'to' ? { backgroundColor: '#0056b3' } : {})}} onClick={() => setActiveTab('to')}>
                        Плановое ТО
                    </button>
                    <button style={{...styles.button, ...(activeTab === 'requests' ? { backgroundColor: '#0056b3' } : {})}} onClick={() => setActiveTab('requests')}>
                        Заявки на ремонт
                    </button>
                    <button style={styles.button} onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Отмена' : '+ ' + (activeTab === 'to' ? 'Создать ТО' : 'Создать заявку')}
                    </button>
                </div>
            </div>

            {error && <div style={styles.error}>{error}</div>}
            {success && <div style={styles.success}>{success}</div>}

            {showForm && activeTab === 'to' && (
                <div style={styles.formContainer}>
                    <h3>Новое плановое ТО</h3>
                    <form onSubmit={handleCreateTO}>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Оборудование *</label>
                                <select style={getInputStyle('equipmentId')} value={formData.equipmentId} onChange={(e) => setFormData({...formData, equipmentId: e.target.value})} required>
                                    <option value="">Выберите оборудование</option>
                                    {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name} (№{eq.id})</option>)}
                                </select>
                                {validationErrors.equipmentId && <div style={getErrorStyle()}>{validationErrors.equipmentId}</div>}
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Тип ТО *</label>
                                <input 
                                    type="text" 
                                    placeholder="Например: Смазка (не более 50 символов)"
                                    style={getInputStyle('type')}
                                    value={formData.type} 
                                    onChange={(e) => {
                                        if (e.target.value.length <= 50) {
                                            setFormData({...formData, type: e.target.value});
                                            setValidationErrors({...validationErrors, type: ''});
                                        } else {
                                            setValidationErrors({...validationErrors, type: 'Тип ТО не должен превышать 50 символов'});
                                        }
                                    }} 
                                    required 
                                />
                                {validationErrors.type && <div style={getErrorStyle()}>{validationErrors.type}</div>}
                                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                                    {formData.type.length}/50 символов
                                </div>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Плановая дата *</label>
                                <input type="date" style={getInputStyle('plannedDate')} value={formData.plannedDate} onChange={(e) => setFormData({...formData, plannedDate: e.target.value})} required />
                                {validationErrors.plannedDate && <div style={getErrorStyle()}>{validationErrors.plannedDate}</div>}
                            </div>
                        </div>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Описание</label>
                                <input type="text" style={getInputStyle('description')} placeholder="Дополнительная информация (не более 100 символов)" value={formData.description} onChange={(e) => {
                                    if (e.target.value.length <= 100) {
                                        setFormData({...formData, description: e.target.value});
                                        setValidationErrors({...validationErrors, description: ''});
                                    } else {
                                        setValidationErrors({...validationErrors, description: 'Описание не должно превышать 100 символов'});
                                    }
                                }} />
                                {validationErrors.description && <div style={getErrorStyle()}>{validationErrors.description}</div>}
                                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                                    {formData.description.length}/100 символов
                                </div>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Ответственный работник</label>
                                <input 
                                    type="text" 
                                    style={styles.input}
                                    placeholder="ФИО (не более 100 символов)"
                                    value={formData.worker} 
                                    onChange={(e) => {
                                        if (e.target.value.length <= 100) {
                                            setFormData({...formData, worker: e.target.value});
                                        }
                                    }} 
                                />
                                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                                    {formData.worker.length}/100 символов
                                </div>
                            </div>
                        </div>
                        <button type="submit" style={styles.button}>Сохранить</button>
                    </form>
                </div>
            )}

            {showForm && activeTab === 'requests' && (
                <div style={styles.formContainer}>
                    <h3>Новая заявка на ремонт</h3>
                    <form onSubmit={handleCreateRepair}>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Оборудование *</label>
                                <select style={getRepairInputStyle('equipmentInventoryNumber')} value={repairForm.equipmentInventoryNumber} onChange={(e) => setRepairForm({...repairForm, equipmentInventoryNumber: e.target.value})} required>
                                    <option value="">Выберите оборудование</option>
                                    {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name} (№{eq.id})</option>)}
                                </select>
                                {repairValidationErrors.equipmentInventoryNumber && <div style={getErrorStyle()}>{repairValidationErrors.equipmentInventoryNumber}</div>}
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Кто зафиксировал *</label>
                                <input 
                                    type="text" 
                                    placeholder="ФИО сотрудника или клиента (не более 50 символов)"
                                    style={getRepairInputStyle('creator')}
                                    value={repairForm.creator} 
                                    onChange={(e) => {
                                        if (e.target.value.length <= 50) {
                                            setRepairForm({...repairForm, creator: e.target.value});
                                            setRepairValidationErrors({...repairValidationErrors, creator: ''});
                                        } else {
                                            setRepairValidationErrors({...repairValidationErrors, creator: 'ФИО не должно превышать 50 символов'});
                                        }
                                    }} 
                                    required 
                                />
                                {repairValidationErrors.creator && <div style={getErrorStyle()}>{repairValidationErrors.creator}</div>}
                                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                                    {repairForm.creator.length}/50 символов
                                </div>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Описание</label>
                                <input type="text" style={getRepairInputStyle('description')} placeholder="Описание проблемы (не более 100 символов)" value={repairForm.description} onChange={(e) => {
                                    if (e.target.value.length <= 100) {
                                        setRepairForm({...repairForm, description: e.target.value});
                                        setRepairValidationErrors({...repairValidationErrors, description: ''});
                                    } else {
                                        setRepairValidationErrors({...repairValidationErrors, description: 'Описание не должно превышать 100 символов'});
                                    }
                                }} />
                                {repairValidationErrors.description && <div style={getErrorStyle()}>{repairValidationErrors.description}</div>}
                                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                                    {repairForm.description.length}/100 символов
                                </div>
                            </div>
                        </div>
                        <button type="submit" style={styles.button}>Создать заявку</button>
                    </form>
                </div>
            )}

            {activeTab === 'to' && (
                <>
                    <h3>Плановое техническое обслуживание</h3>
                    {loading ? (
                        <p>Загрузка...</p>
                    ) : (
                        <>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>ID</th>
                                        <th style={styles.th}>Оборудование</th>
                                        <th style={styles.th}>Тип ТО</th>
                                        <th style={styles.th}>Плановая дата</th>
                                        <th style={styles.th}>Статус</th>
                                        <th style={styles.th}>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {toRepairs.map(to => (
                                        <tr key={to.id}>
                                            <td style={styles.td}>{to.id}</td>
                                            <td style={styles.td}>{getEquipmentName(to.equipmentId)}</td>
                                            <td style={styles.td}>{to.type}</td>
                                            <td style={styles.td}>{to.plannedDate}</td>
                                            <td style={styles.td}><span style={styles.statusBadge(to.status || 'Запланировано')}>{to.status || 'Запланировано'}</span></td>
                                            <td style={styles.td}>
                                                {(to.status === 'Запланировано' || !to.status) && (
                                                    <button style={styles.completeBtn} onClick={() => handleCompleteTO(to.id, to.equipmentId)} disabled={updatingId === to.id}>
                                                        {updatingId === to.id ? '...' : 'Выполнить'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {renderTOPagination()}
                        </>
                    )}
                </>
            )}

            {activeTab === 'requests' && (
                <>
                    <h3>Заявки на ремонт</h3>
                    {loading ? (
                        <p>Загрузка...</p>
                    ) : (
                        <>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>ID</th>
                                        <th style={styles.th}>Оборудование</th>
                                        <th style={styles.th}>Кто зафиксировал</th>
                                        <th style={styles.th}>Описание</th>
                                        <th style={styles.th}>Дата</th>
                                        <th style={styles.th}>Статус</th>
                                        <th style={styles.th}>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map(req => (
                                        <tr key={req.id}>
                                            <td style={styles.td}>{req.id}</td>
                                            <td style={styles.td}>{getEquipmentName(req.equipmentInventoryNumber)}</td>
                                            <td style={styles.td}>{req.creator || '-'}</td>
                                            <td style={styles.td}>{req.description || '-'}</td>
                                            <td style={styles.td}>{req.created_at ? new Date(req.created_at).toLocaleDateString() : '-'}</td>
                                            <td style={styles.td}><span style={styles.statusBadge(req.status)}>{req.status}</span></td>
                                            <td style={styles.td}>
                                                <select style={styles.statusSelect} value={req.status} onChange={(e) => handleUpdateRequestStatus(req.id, e.target.value)} disabled={updatingId === req.id}>
                                                    {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                                {updatingId === req.id && <span> ⏳</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {renderReqPagination()}
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default TORepairPages;