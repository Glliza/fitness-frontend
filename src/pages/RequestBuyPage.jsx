import React, { useState, useEffect } from 'react';
import { requestBuyService } from '../services/requestBuyService';
import { equipmentService } from '../services/equipmentService';

const RequestBuyPage = () => {
    const [requests, setRequests] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        equipmentInventoryNumber: '',
        name: '',
        count: 1,
    });

    const loadData = async () => {
        try {
            setLoading(true);
            const [requestsRes, equipmentRes] = await Promise.all([
                requestBuyService.getAll(),
                equipmentService.getAll()
            ]);
            setRequests(requestsRes.data);
            setEquipment(equipmentRes.data);
            setError('');
        } catch (err) {
            setError('Ошибка загрузки данных');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await requestBuyService.create(formData);
            setShowForm(false);
            setFormData({ equipmentInventoryNumber: '', name: '', count: 1 });
            loadData();
        } catch (err) {
            setError('Ошибка создания заявки');
        }
    };

    const getEquipmentName = (invNumber) => {
        const eq = equipment.find(e => e.id === invNumber);
        return eq ? eq.name : 'Новое оборудование';
    };

    const styles = {
        container: { padding: '2rem' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
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
        error: { backgroundColor: '#f8d7da', color: '#721c24', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' },
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1>Заявки на закупку</h1>
                <button style={styles.button} onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Отмена' : '+ Новая заявка'}
                </button>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            {showForm && (
                <div style={styles.formContainer}>
                    <h3>Новая заявка на закупку</h3>
                    <form onSubmit={handleCreate}>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Оборудование</label>
                                <select style={styles.select} value={formData.equipmentInventoryNumber} onChange={(e) => setFormData({...formData, equipmentInventoryNumber: e.target.value ? parseInt(e.target.value) : null})}>
                                    <option value="">Новое оборудование (не в системе)</option>
                                    {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name} (№{eq.id})</option>)}
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Наименование для закупки</label>
                                <input type="text" style={styles.input} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Количество</label>
                                <input type="number" style={styles.input} value={formData.count} onChange={(e) => setFormData({...formData, count: parseInt(e.target.value)})} min="1" required />
                            </div>
                        </div>
                        <button type="submit" style={styles.button}>Создать</button>
                    </form>
                </div>
            )}

            {loading ? <p>Загрузка...</p> : (
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}>Оборудование</th>
                            <th style={styles.th}>Наименование</th>
                            <th style={styles.th}>Количество</th>
                            <th style={styles.th}>Дата создания</th>
                            <th style={styles.th}>Статус</th>
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
                                <td style={styles.td}>{req.name}</td>
                                <td style={styles.td}>{req.count}</td>
                                <td style={styles.td}>{req.created_at}</td>
                                <td style={styles.td}>{req.status || 'ОТКРЫТА'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default RequestBuyPage;