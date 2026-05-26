import React, { useState, useEffect } from 'react';
import { maintenanceService } from '../services/maintenanceService';
import { equipmentService } from '../services/equipmentService';

const TORepairPages = () => {
    const [toRepairs, setToRepairs] = useState([]);
    const [requests, setRequests] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('to');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        equipmentId: '',
        type: '',
        plannedDate: '',
        description: '',
        worker: '',
    });
    const [repairForm, setRepairForm] = useState({
        equipmentInventoryNumber: '',
        creator: 'Администратор',
        tORepairId: null,
    });
    const [history, setHistory] = useState([]);
    const [selectedEquipment, setSelectedEquipment] = useState('');
    const [nextDate, setNextDate] = useState(null);

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
        } catch (err) {
            setError('Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    };

    const loadToRepairs = async () => {
        try {
            const response = await maintenanceService.getAllTO();
            setToRepairs(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadRequests = async () => {
        try {
            const response = await maintenanceService.getAllRequests();
            setRequests(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadHistory = async (equipmentId) => {
        try {
            const response = await maintenanceService.getHistory(equipmentId);
            setHistory(response.data);
            const nextDateRes = await maintenanceService.getNextTODate(equipmentId);
            setNextDate(nextDateRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreateTO = async (e) => {
        e.preventDefault();
        try {
            await maintenanceService.createTO(formData);
            setShowForm(false);
            setFormData({ equipmentId: '', type: '', plannedDate: '', description: '', worker: '' });
            loadToRepairs();
        } catch (err) {
            setError('Ошибка создания ТО');
        }
    };

    const handleCreateRepair = async (e) => {
        e.preventDefault();
        try {
            await maintenanceService.createRepair(repairForm);
            setShowForm(false);
            setRepairForm({ equipmentInventoryNumber: '', creator: 'Администратор', tORepairId: null });
            loadRequests();
        } catch (err) {
            setError('Ошибка создания заявки');
        }
    };

    const handleUpdateStatus = async (requestId, newStatus, worker) => {
        try {
            await maintenanceService.updateRequestStatus(requestId, newStatus, worker);
            loadRequests();
        } catch (err) {
            setError('Ошибка изменения статуса');
        }
    };

    const getEquipmentName = (equipmentId) => {
        const eq = equipment.find(e => e.id === equipmentId);
        return eq ? eq.name : 'Неизвестно';
    };

    const styles = {
        container: { padding: '2rem' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
        tabs: { display: 'flex', gap: '1rem' },
        tab: { padding: '0.5rem 1rem', backgroundColor: '#e9ecef', border: 'none', borderRadius: '4px', cursor: 'pointer' },
        activeTab: { backgroundColor: '#007bff', color: 'white' },
        button: { backgroundColor: '#007bff', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' },
        formContainer: { marginTop: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white', marginBottom: '2rem' },
        formRow: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
        formGroup: { flex: 1, minWidth: '200px' },
        label: { display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' },
        input: { width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' },
        select: { width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' },
        table: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', marginTop: '1rem' },
        th: { border: '1px solid #ddd', padding: '0.75rem', textAlign: 'left', backgroundColor: '#f2f2f2' },
        td: { border: '1px solid #ddd', padding: '0.75rem' },
        statusBtn: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', margin: '0.25rem' },
        historyContainer: { marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' },
        error: { backgroundColor: '#f8d7da', color: '#721c24', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' },
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

            {showForm && activeTab === 'to' && (
                <div style={styles.formContainer}>
                    <h3>Новое плановое ТО</h3>
                    <form onSubmit={handleCreateTO}>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Оборудование</label>
                                <select style={styles.select} value={formData.equipmentId} onChange={(e) => setFormData({...formData, equipmentId: parseInt(e.target.value)})} required>
                                    <option value="">Выберите оборудование</option>
                                    {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name} (№{eq.id})</option>)}
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Тип ТО</label>
                                <input type="text" style={styles.input} value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} required />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Плановая дата</label>
                                <input type="date" style={styles.input} value={formData.plannedDate} onChange={(e) => setFormData({...formData, plannedDate: e.target.value})} required />
                            </div>
                        </div>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Описание</label>
                                <input type="text" style={styles.input} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Работник</label>
                                <input type="text" style={styles.input} value={formData.worker} onChange={(e) => setFormData({...formData, worker: e.target.value})} />
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
                                <label style={styles.label}>Оборудование</label>
                                <select style={styles.select} value={repairForm.equipmentInventoryNumber} onChange={(e) => setRepairForm({...repairForm, equipmentInventoryNumber: parseInt(e.target.value)})} required>
                                    <option value="">Выберите оборудование</option>
                                    {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name} (№{eq.id})</option>)}
                                </select>
                            </div>
                        </div>
                        <button type="submit" style={styles.button}>Создать заявку</button>
                    </form>
                </div>
            )}

            {activeTab === 'to' && (
                <>
                    <h3>Плановое техническое обслуживание</h3>
                    {loading ? <p>Загрузка...</p> : (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>ID</th>
                                    <th style={styles.th}>Оборудование</th>
                                    <th style={styles.th}>Тип</th>
                                    <th style={styles.th}>Плановая дата</th>
                                    <th style={styles.th}>Статус</th>
                                </tr>
                            </thead>
                            <tbody>
                                {toRepairs.map(to => (
                                    <tr key={to.id}>
                                        <td style={styles.td}>{to.id}</td>
                                        <td style={styles.td}>{getEquipmentName(to.equipmentId)}</td>
                                        <td style={styles.td}>{to.type}</td>
                                        <td style={styles.td}>{to.plannedDate}</td>
                                        <td style={styles.td}>{to.status || 'Запланировано'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}

            {activeTab === 'requests' && (
                <>
                    <h3>Заявки на ремонт</h3>
                    {loading ? <p>Загрузка...</p> : (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>ID</th>
                                    <th style={styles.th}>Оборудование</th>
                                    <th style={styles.th}>Создатель</th>
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
                                        <td style={styles.td}>{req.creator}</td>
                                        <td style={styles.td}>{req.created_at?.split('T')[0]}</td>
                                        <td style={styles.td}>{req.status}</td>
                                        <td style={styles.td}>
                                            {req.status === 'Открыта' && (
                                                <button style={styles.statusBtn} onClick={() => handleUpdateStatus(req.id, 'В работе', 'Мастер')}>
                                                    В работу
                                                </button>
                                            )}
                                            {req.status === 'В работе' && (
                                                <button style={styles.statusBtn} onClick={() => handleUpdateStatus(req.id, 'Выполнена', 'Мастер')}>
                                                    Выполнить
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

            <div style={styles.historyContainer}>
                <h3>История ТО и ремонтов</h3>
                <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Выберите оборудование</label>
                        <select style={styles.select} value={selectedEquipment} onChange={(e) => { setSelectedEquipment(e.target.value); loadHistory(e.target.value); }}>
                            <option value="">Выберите оборудование</option>
                            {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name} (№{eq.id})</option>)}
                        </select>
                    </div>
                    {nextDate && <div><strong>Следующая дата ТО:</strong> {nextDate}</div>}
                </div>
                {history.length > 0 && (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Тип</th>
                                <th style={styles.th}>Дата</th>
                                <th style={styles.th}>Работник</th>
                                <th style={styles.th}>Описание</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((h, idx) => (
                                <tr key={idx}>
                                    <td style={styles.td}>{h.type}</td>
                                    <td style={styles.td}>{h.date}</td>
                                    <td style={styles.td}>{h.worker}</td>
                                    <td style={styles.td}>{h.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default TORepairPages;