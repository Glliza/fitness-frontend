import React, { useState, useEffect } from 'react';
import { maintenanceService } from '../services/maintenanceService';
import { equipmentService } from '../services/equipmentService';

const HistoryPage = () => {
    const [equipment, setEquipment] = useState([]);
    const [history, setHistory] = useState([]);
    const [selectedEquipment, setSelectedEquipment] = useState('');
    const [nextDate, setNextDate] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadEquipment = async () => {
        try {
            const response = await equipmentService.getAll();
            setEquipment(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadHistory = async (equipmentId) => {
        if (!equipmentId) return;
        setLoading(true);
        try {
            const [historyRes, nextDateRes] = await Promise.all([
                maintenanceService.getHistory(equipmentId),
                maintenanceService.getNextTODate(equipmentId)
            ]);
            setHistory(historyRes.data);
            setNextDate(nextDateRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEquipment();
    }, []);

    const styles = {
        container: { padding: '2rem' },
        title: { marginBottom: '2rem' },
        filterContainer: { padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '2rem' },
        formRow: { display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' },
        formGroup: { flex: 1, minWidth: '200px' },
        label: { display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' },
        select: { width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' },
        table: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' },
        th: { border: '1px solid #ddd', padding: '0.75rem', textAlign: 'left', backgroundColor: '#f2f2f2' },
        td: { border: '1px solid #ddd', padding: '0.75rem' },
        nextDateContainer: { marginTop: '1rem', padding: '0.5rem', backgroundColor: '#d4edda', borderRadius: '4px' },
        emptyMessage: { textAlign: 'center', padding: '2rem', color: '#6c757d' },
    };

    const getEquipmentName = (id) => {
        const eq = equipment.find(e => e.id === id);
        return eq ? eq.name : 'Неизвестно';
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>История ТО и ремонтов</h1>
            
            <div style={styles.filterContainer}>
                <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Выберите оборудование</label>
                        <select 
                            style={styles.select} 
                            value={selectedEquipment} 
                            onChange={(e) => {
                                setSelectedEquipment(e.target.value);
                                loadHistory(e.target.value);
                            }}
                        >
                            <option value="">Выберите оборудование</option>
                            {equipment.map(eq => (
                                <option key={eq.id} value={eq.id}>
                                    {eq.name} (№{eq.id})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {nextDate && (
                    <div style={styles.nextDateContainer}>
                        <strong>📅 Следующая дата ТО:</strong> {nextDate}
                    </div>
                )}
            </div>

            {loading ? (
                <p>Загрузка...</p>
            ) : selectedEquipment && history.length === 0 ? (
                <div style={styles.emptyMessage}>
                    Нет истории для выбранного оборудования
                </div>
            ) : selectedEquipment && history.length > 0 ? (
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Оборудование</th>
                            <th style={styles.th}>Тип</th>
                            <th style={styles.th}>Дата</th>
                            <th style={styles.th}>Работник</th>
                            <th style={styles.th}>Описание</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((h, idx) => (
                            <tr key={idx}>
                                <td style={styles.td}>{getEquipmentName(selectedEquipment)}</td>
                                <td style={styles.td}>{h.type}</td>
                                <td style={styles.td}>{h.date}</td>
                                <td style={styles.td}>{h.worker || '-'}</td>
                                <td style={styles.td}>{h.description || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div style={styles.emptyMessage}>
                    Выберите оборудование для просмотра истории
                </div>
            )}
        </div>
    );
};

export default HistoryPage;