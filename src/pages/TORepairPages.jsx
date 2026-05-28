import React, { useState, useEffect } from 'react';
import { maintenanceService } from '../services/maintenanceService';
import { equipmentService } from '../services/equipmentService';

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

    const loadData = async () => {
        try {
            setLoading(true);
            const [equipmentRes] = await Promise.all([
                equipmentService.getAll(),
            ]);
            setEquipment(equipmentRes.data);
            await loadToRepairs();
            await loadRequests();
            setError('');
            setSuccess('');
        } catch (err) {
            setError('Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    };

    const loadToRepairs = async () => {
        try {
            const response = await maintenanceService.getAllTO();
            console.log('Загружены ТО:', response.data);
            setToRepairs(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadRequests = async () => {
        try {
            const response = await maintenanceService.getAllRequests();
            console.log('Загружены заявки:', response.data);
            setRequests(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreateTO = async (e) => {
        e.preventDefault();
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
            console.log('Отправка ТО:', dataToSend);
            await maintenanceService.createTO(dataToSend);
            setShowForm(false);
            setFormData({ equipmentId: '', type: '', plannedDate: '', description: '', worker: '' });
            await loadToRepairs();
            setSuccess('Плановое ТО успешно создано');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Ошибка:', err);
            setError('Ошибка создания ТО');
        }
    };

    const handleCreateRepair = async (e) => {
        e.preventDefault();
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
            console.log('Отправка заявки:', dataToSend);
            await maintenanceService.createRepair(dataToSend);
            setShowForm(false);
            setRepairForm({ equipmentInventoryNumber: '', creator: '', description: '' });
            await loadRequests();
            // Обновляем статус оборудования на "Сломано"
            if (repairForm.equipmentInventoryNumber) {
                await equipmentService.changeStatus(repairForm.equipmentInventoryNumber, 'Сломано');
            }
            setSuccess('Заявка на ремонт успешно создана');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Ошибка:', err);
            setError('Ошибка создания заявки');
        }
    };

    const handleCompleteTO = async (toId, equipmentId) => {
        setUpdatingId(toId);
        try {
            await maintenanceService.completeTO(toId);
            await loadToRepairs();
            // Получаем следующую дату ТО
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
            await loadRequests();
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

    const styles = {
        container: { padding: '2rem' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
        tabs: { display: 'flex', gap: '1rem' },
        tab: { padding: '0.5rem 1rem', backgroundColor: '#e9ecef', border: 'none', borderRadius: '4px', cursor: 'pointer' },
        activeTab: { backgroundColor: '#007bff', color: 'white' },
        button: { backgroundColor: '#007bff', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' },
        completeBtn: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' },
        formContainer: { marginTop: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white', marginBottom: '2rem' },
        formRow: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
        formGroup: { flex: 1, minWidth: '200px' },
        label: { display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' },
        input: { width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' },
        select: { width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' },
        table: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', marginTop: '1rem' },
        th: { border: '1px solid #ddd', padding: '0.75rem', textAlign: 'left', backgroundColor: '#f2f2f2' },
        td: { border: '1px solid #ddd', padding: '0.75rem' },
        statusBadge: (status) => ({
            display: 'inline-block',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.875rem',
            backgroundColor: getStatusColor(status),
            color: 'white',
        }),
        statusSelect: { 
            padding: '0.25rem 0.5rem', 
            borderRadius: '4px', 
            border: '1px solid #ccc', 
            cursor: 'pointer',
            minWidth: '120px',
            fontSize: '0.875rem'
        },
        error: { backgroundColor: '#f8d7da', color: '#721c24', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' },
        success: { backgroundColor: '#d4edda', color: '#155724', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' },
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1>Техническое обслуживание и ремонты</h1>
                <div style={styles.tabs}>
                    <button style={{...styles.tab, ...(activeTab === 'to' ? styles.activeTab : {})}} onClick={() => setActiveTab('to')}>
                        Плановое ТО
                    </button>
                    <button style={{...styles.tab, ...(activeTab === 'requests' ? styles.activeTab : {})}} onClick={() => setActiveTab('requests')}>
                        Заявки на ремонт
                    </button>
                    <button style={styles.button} onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Отмена' : '+ ' + (activeTab === 'to' ? 'Создать ТО' : 'Создать заявку')}
                    </button>
                </div>
            </div>

            {error && <div style={styles.error}>{error}</div>}
            {success && <div style={styles.success}>{success}</div>}

            {/* Форма создания планового ТО */}
            {showForm && activeTab === 'to' && (
                <div style={styles.formContainer}>
                    <h3>Новое плановое ТО</h3>
                    <form onSubmit={handleCreateTO}>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Оборудование *</label>
                                <select 
                                    style={styles.select} 
                                    value={formData.equipmentId} 
                                    onChange={(e) => setFormData({...formData, equipmentId: e.target.value})} 
                                    required
                                >
                                    <option value="">Выберите оборудование</option>
                                    {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name} (№{eq.id})</option>)}
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Тип ТО *</label>
                                <input 
                                    type="text" 
                                    style={styles.input} 
                                    placeholder="Например: Смазка, Диагностика"
                                    value={formData.type} 
                                    onChange={(e) => setFormData({...formData, type: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Плановая дата *</label>
                                <input 
                                    type="date" 
                                    style={styles.input} 
                                    value={formData.plannedDate} 
                                    onChange={(e) => setFormData({...formData, plannedDate: e.target.value})} 
                                    required 
                                />
                            </div>
                        </div>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Описание</label>
                                <input 
                                    type="text" 
                                    style={styles.input} 
                                    placeholder="Дополнительная информация"
                                    value={formData.description} 
                                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Ответственный работник</label>
                                <input 
                                    type="text" 
                                    style={styles.input} 
                                    placeholder="ФИО"
                                    value={formData.worker} 
                                    onChange={(e) => setFormData({...formData, worker: e.target.value})} 
                                />
                            </div>
                        </div>
                        <button type="submit" style={styles.button}>Сохранить</button>
                    </form>
                </div>
            )}

            {/* Форма создания заявки на ремонт */}
            {showForm && activeTab === 'requests' && (
                <div style={styles.formContainer}>
                    <h3>Новая заявка на ремонт</h3>
                    <form onSubmit={handleCreateRepair}>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Оборудование *</label>
                                <select 
                                    style={styles.select} 
                                    value={repairForm.equipmentInventoryNumber} 
                                    onChange={(e) => setRepairForm({...repairForm, equipmentInventoryNumber: e.target.value})} 
                                    required
                                >
                                    <option value="">Выберите оборудование</option>
                                    {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name} (№{eq.id})</option>)}
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Кто зафиксировал поломку *</label>
                                <input 
                                    type="text" 
                                    style={styles.input} 
                                    placeholder="ФИО сотрудника или клиента"
                                    value={repairForm.creator} 
                                    onChange={(e) => setRepairForm({...repairForm, creator: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Описание поломки</label>
                                <input 
                                    type="text" 
                                    style={styles.input} 
                                    placeholder="Описание проблемы"
                                    value={repairForm.description} 
                                    onChange={(e) => setRepairForm({...repairForm, description: e.target.value})} 
                                />
                            </div>
                        </div>
                        <button type="submit" style={styles.button}>Создать заявку</button>
                    </form>
                </div>
            )}

            {/* Таблица планового ТО */}
            {activeTab === 'to' && (
                <>
                    <h3>Плановое техническое обслуживание</h3>
                    {loading ? <p>Загрузка...</p> : (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>ID</th>
                                    <th style={styles.th}>Оборудование</th>
                                    <th style={styles.th}>Тип ТО</th>
                                    <th style={styles.th}>Плановая дата</th>
                                    <th style={styles.th}>Описание</th>
                                    <th style={styles.th}>Работник</th>
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
                                        <td style={styles.td}>{to.description || '-'}</td>
                                        <td style={styles.td}>{to.worker || '-'}</td>
                                        <td style={styles.td}>
                                            <span style={styles.statusBadge(to.status || 'Запланировано')}>
                                                {to.status || 'Запланировано'}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            {(to.status === 'Запланировано' || !to.status) && (
                                                <button 
                                                    style={styles.completeBtn} 
                                                    onClick={() => handleCompleteTO(to.id, to.equipmentId)}
                                                    disabled={updatingId === to.id}
                                                >
                                                    {updatingId === to.id ? '...' : 'Выполнить'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}

            {/* Таблица заявок на ремонт */}
            {activeTab === 'requests' && (
                <>
                    <h3>Заявки на ремонт</h3>
                    {loading ? <p>Загрузка...</p> : (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>ID</th>
                                    <th style={styles.th}>Оборудование</th>
                                    <th style={styles.th}>Кто зафиксировал</th>
                                    <th style={styles.th}>Описание</th>
                                    <th style={styles.th}>Дата и время</th>
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
                                        <td style={styles.td}>{req.created_at ? new Date(req.created_at).toLocaleString() : '-'}</td>
                                        <td style={styles.td}>
                                            <span style={styles.statusBadge(req.status)}>{req.status}</span>
                                        </td>
                                        <td style={styles.td}>
                                            <select
                                                style={styles.statusSelect}
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
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}
        </div>
    );
};

export default TORepairPages;