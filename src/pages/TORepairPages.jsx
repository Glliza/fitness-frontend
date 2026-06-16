import React, { useState, useEffect, useCallback } from 'react';
import { maintenanceService } from '../services/maintenanceService';
import { equipmentService } from '../services/equipmentService';
import './TORepairPages.css';

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
            const response = await maintenanceService.getAllTO(page, toPageSize, 'id', 'asc');
            console.log('ОТВЕТ СЕРВЕРА (ТО)');
            console.log('Содержимое:', response.data.content);
            console.log('Первая запись:', response.data.content[0]);
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
            const response = await maintenanceService.getAllRequests(page, reqPageSize, 'id', 'asc');
            console.log(' ОТВЕТ СЕРВЕРА (ЗАЯВКИ)');
            console.log('Содержимое:', response.data.content);
            console.log('Первая запись:', response.data.content[0]);
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
        borderColor: validationErrors[fieldName] ? '#dc3545' : '#ccc',
    });

    const getRepairInputStyle = (fieldName) => ({
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
            <div className="torepair-pagination">
                <button className="torepair-page-button" onClick={() => setToPage(0)} disabled={toPage === 0}>⏮ Первая</button>
                <button className="torepair-page-button" onClick={() => setToPage(toPage - 1)} disabled={toPage === 0}>◀ Назад</button>
                {startPage > 0 && <span className="torepair-page-info">...</span>}
                {pages.map(p => (
                    <button key={p} className={p === toPage ? "torepair-active-page-button" : "torepair-page-button"} onClick={() => setToPage(p)}>
                        {p + 1}
                    </button>
                ))}
                {endPage < toTotalPages - 1 && <span className="torepair-page-info">...</span>}
                <button className="torepair-page-button" onClick={() => setToPage(toPage + 1)} disabled={toPage === toTotalPages - 1}>Вперед ▶</button>
                <button className="torepair-page-button" onClick={() => setToPage(toTotalPages - 1)} disabled={toPage === toTotalPages - 1}>Последняя ⏩</button>
                <span className="torepair-page-info">Страница {toPage + 1} из {toTotalPages} (всего {toTotalElements})</span>
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
            <div className="torepair-pagination">
                <button className="torepair-page-button" onClick={() => setReqPage(0)} disabled={reqPage === 0}>⏮ Первая</button>
                <button className="torepair-page-button" onClick={() => setReqPage(reqPage - 1)} disabled={reqPage === 0}>◀ Назад</button>
                {startPage > 0 && <span className="torepair-page-info">...</span>}
                {pages.map(p => (
                    <button key={p} className={p === reqPage ? "torepair-active-page-button" : "torepair-page-button"} onClick={() => setReqPage(p)}>
                        {p + 1}
                    </button>
                ))}
                {endPage < reqTotalPages - 1 && <span className="torepair-page-info">...</span>}
                <button className="torepair-page-button" onClick={() => setReqPage(reqPage + 1)} disabled={reqPage === reqTotalPages - 1}>Вперед ▶</button>
                <button className="torepair-page-button" onClick={() => setReqPage(reqTotalPages - 1)} disabled={reqPage === reqTotalPages - 1}>Последняя ⏩</button>
                <span className="torepair-page-info">Страница {reqPage + 1} из {reqTotalPages} (всего {reqTotalElements})</span>
            </div>
        );
    };

    return (
        <div className="torepair-container">
            <div className="torepair-header">
                <h1 className="torepair-title">Техническое обслуживание и ремонты</h1>
                <div className="torepair-tabs">
                    <button className={`torepair-tab ${activeTab === 'to' ? 'torepair-tab-active' : ''}`} onClick={() => setActiveTab('to')}>
                        Плановое ТО
                    </button>
                    <button className={`torepair-tab ${activeTab === 'requests' ? 'torepair-tab-active' : ''}`} onClick={() => setActiveTab('requests')}>
                        Заявки на ремонт
                    </button>
                    <button className="torepair-button" onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Отмена' : '+ ' + (activeTab === 'to' ? 'Создать ТО' : 'Создать заявку')}
                    </button>
                </div>
            </div>

            {error && <div className="torepair-error">{error}</div>}
            {success && <div className="torepair-success">{success}</div>}

            {showForm && activeTab === 'to' && (
                <div className="torepair-form-container">
                    <h3>Новое плановое ТО</h3>
                    <form onSubmit={handleCreateTO}>
                        <div className="torepair-form-row">
                            <div className="torepair-form-group">
                                <label className="torepair-label">Оборудование *</label>
                                <select className="torepair-select" style={getInputStyle('equipmentId')} value={formData.equipmentId} onChange={(e) => setFormData({...formData, equipmentId: e.target.value})} required>
                                    <option value="">Выберите оборудование</option>
                                    {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name} (№{eq.id})</option>)}
                                </select>
                                {validationErrors.equipmentId && <div className="torepair-validation-error">{validationErrors.equipmentId}</div>}
                            </div>
                            <div className="torepair-form-group">
                                <label className="torepair-label">Тип ТО *</label>
                                <input 
                                    type="text" 
                                    placeholder="Например: Смазка (не более 50 символов)"
                                    className="torepair-input"
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
                                {validationErrors.type && <div className="torepair-validation-error">{validationErrors.type}</div>}
                                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                                    {formData.type.length}/50 символов
                                </div>
                            </div>
                            <div className="torepair-form-group">
                                <label className="torepair-label">Плановая дата *</label>
                                <input type="date" className="torepair-input" style={getInputStyle('plannedDate')} value={formData.plannedDate} onChange={(e) => setFormData({...formData, plannedDate: e.target.value})} required />
                                {validationErrors.plannedDate && <div className="torepair-validation-error">{validationErrors.plannedDate}</div>}
                            </div>
                        </div>
                        <div className="torepair-form-row">
                            <div className="torepair-form-group">
                                <label className="torepair-label">Описание</label>
                                <input type="text" className="torepair-input" style={getInputStyle('description')} placeholder="Дополнительная информация (не более 100 символов)" value={formData.description} onChange={(e) => {
                                    if (e.target.value.length <= 100) {
                                        setFormData({...formData, description: e.target.value});
                                        setValidationErrors({...validationErrors, description: ''});
                                    } else {
                                        setValidationErrors({...validationErrors, description: 'Описание не должно превышать 100 символов'});
                                    }
                                }} />
                                {validationErrors.description && <div className="torepair-validation-error">{validationErrors.description}</div>}
                                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                                    {formData.description.length}/100 символов
                                </div>
                            </div>
                            <div className="torepair-form-group">
                                <label className="torepair-label">Ответственный работник</label>
                                <input 
                                    type="text" 
                                    className="torepair-input"
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
                        <button type="submit" className="torepair-button">Сохранить</button>
                    </form>
                </div>
            )}

            {showForm && activeTab === 'requests' && (
                <div className="torepair-form-container">
                    <h3>Новая заявка на ремонт</h3>
                    <form onSubmit={handleCreateRepair}>
                        <div className="torepair-form-row">
                            <div className="torepair-form-group">
                                <label className="torepair-label">Оборудование *</label>
                                <select className="torepair-select" style={getRepairInputStyle('equipmentInventoryNumber')} value={repairForm.equipmentInventoryNumber} onChange={(e) => setRepairForm({...repairForm, equipmentInventoryNumber: e.target.value})} required>
                                    <option value="">Выберите оборудование</option>
                                    {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name} (№{eq.id})</option>)}
                                </select>
                                {repairValidationErrors.equipmentInventoryNumber && <div className="torepair-validation-error">{repairValidationErrors.equipmentInventoryNumber}</div>}
                            </div>
                            <div className="torepair-form-group">
                                <label className="torepair-label">Кто зафиксировал *</label>
                                <input 
                                    type="text" 
                                    placeholder="ФИО сотрудника или клиента (не более 50 символов)"
                                    className="torepair-input"
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
                                {repairValidationErrors.creator && <div className="torepair-validation-error">{repairValidationErrors.creator}</div>}
                                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                                    {repairForm.creator.length}/50 символов
                                </div>
                            </div>
                            <div className="torepair-form-group">
                                <label className="torepair-label">Описание</label>
                                <input type="text" className="torepair-input" style={getRepairInputStyle('description')} placeholder="Описание проблемы (не более 100 символов)" value={repairForm.description} onChange={(e) => {
                                    if (e.target.value.length <= 100) {
                                        setRepairForm({...repairForm, description: e.target.value});
                                        setRepairValidationErrors({...repairValidationErrors, description: ''});
                                    } else {
                                        setRepairValidationErrors({...repairValidationErrors, description: 'Описание не должно превышать 100 символов'});
                                    }
                                }} />
                                {repairValidationErrors.description && <div className="torepair-validation-error">{repairValidationErrors.description}</div>}
                                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                                    {repairForm.description.length}/100 символов
                                </div>
                            </div>
                        </div>
                        <button type="submit" className="torepair-button">Создать заявку</button>
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
                            <div className="torepair-table-wrapper">
                                <table className="torepair-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Оборудование</th>
                                            <th>Тип ТО</th>
                                            <th>Плановая дата</th>
                                            <th>Описание</th>
                                            <th>Ответственный</th>
                                            <th>Статус</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {toRepairs.map(to => {
                                            // Определяем класс статуса
                                            let statusClass = 'torepair-status-badge';
                                            if (to.status === 'Выполнена') {
                                                statusClass += ' torepair-status-vipolnena';
                                            } else {
                                                statusClass += ' torepair-status-zaplanirovano';
                                            }
                                            
                                            return (
                                                <tr key={to.id}>
                                                    <td>{to.id}</td>
                                                    <td className="torepair-cell-equipment">{getEquipmentName(to.equipmentId)}</td>
                                                    <td>{to.type}</td>
                                                    <td>{to.plannedDate}</td>
                                                    <td className="torepair-cell-description">{to.description || '-'}</td>
                                                    <td className="torepair-cell-worker">{to.worker || '-'}</td>
                                                    <td>
                                                        <span className={statusClass}>
                                                            {to.status || 'Запланировано'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {(!to.status || to.status === 'Запланировано') && (
                                                            <button 
                                                                className="torepair-complete-btn" 
                                                                onClick={() => handleCompleteTO(to.id, to.equipmentId)} 
                                                                disabled={updatingId === to.id}
                                                            >
                                                                {updatingId === to.id ? '...' : 'Выполнить'}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
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
                            <div className="torepair-table-wrapper">
                                <table className="torepair-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Оборудование</th>
                                            <th>Кто зафиксировал</th>
                                            <th>Описание</th>
                                            <th>Дата</th>
                                            <th>Статус</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requests.map(req => {
                                            let statusClass = 'torepair-status-badge';
                                            if (req.status === 'Открыта') {
                                                statusClass += ' torepair-status-otkrita';
                                            } else if (req.status === 'В работе') {
                                                statusClass += ' torepair-status-vrabote';
                                            } else if (req.status === 'Выполнена') {
                                                statusClass += ' torepair-status-vipolnena';
                                            }
                                            
                                            return (
                                                <tr key={req.id}>
                                                    <td>{req.id}</td>
                                                    <td className="torepair-cell-equipment">{getEquipmentName(req.equipmentInventoryNumber)}</td>
                                                    <td className="torepair-cell-worker">{req.creator || '-'}</td>
                                                    <td className="torepair-cell-description">{req.description || '-'}</td>
                                                    <td>{req.created_at ? new Date(req.created_at).toLocaleString() : '-'}</td>
                                                    <td>
                                                        <span className={statusClass}>
                                                            {req.status || 'Открыта'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <select 
                                                            className="torepair-status-select" 
                                                            value={req.status} 
                                                            onChange={(e) => handleUpdateRequestStatus(req.id, e.target.value)} 
                                                            disabled={updatingId === req.id}
                                                        >
                                                            {statusOptions.map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                        {updatingId === req.id && <span> ⏳</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {renderReqPagination()}
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default TORepairPages;