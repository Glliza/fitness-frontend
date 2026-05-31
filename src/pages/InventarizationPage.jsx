import React, { useState, useEffect } from 'react';
import { inventarizationService } from '../services/inventarizationService';
import { zoneService } from '../services/zoneService';
import { equipmentService } from '../services/equipmentService';
import { commonStyles } from '../styles/globalStyles';

const InventarizationPage = () => {
    const [zones, setZones] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [inventarizations, setInventarizations] = useState([]);
    const [groupedInventarizations, setGroupedInventarizations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedZone, setSelectedZone] = useState('');
    const [reports, setReports] = useState([]); // История инвентаризаций
    const [inProgress, setInProgress] = useState(false);
    const [isAllMode, setIsAllMode] = useState(false);

    const loadZones = async () => {
        try {
            const response = await zoneService.getAll(0, 100);
            setZones(response.data.content || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadEquipment = async () => {
        try {
            const response = await equipmentService.getAll(0, 100);
            setEquipment(response.data.content || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadHistory = async () => {
        try {
            const response = await inventarizationService.getHistory();
            setReports(response.data);
        } catch (err) {
            console.error('Ошибка загрузки истории:', err);
        }
    };

    useEffect(() => {
        loadZones();
        loadEquipment();
        loadHistory(); // Загружаем историю при загрузке страницы
    }, []);

    const handleStart = async () => {
        if (!selectedZone) {
            setError('Выберите зону');
            return;
        }
        setLoading(true);
        setError('');
        setIsAllMode(false);
        try {
            const response = await inventarizationService.start(selectedZone);
            setInventarizations(response.data);
            setInProgress(true);
            if (!response.data || response.data.length === 0) {
                setError('В выбранной зоне нет оборудования для инвентаризации');
                setInProgress(false);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка начала инвентаризации');
        } finally {
            setLoading(false);
        }
    };

    const handleStartAll = async () => {
        setLoading(true);
        setError('');
        setIsAllMode(true);
        try {
            const response = await inventarizationService.startAll();
            if (!response.data || response.data.length === 0) {
                setError('Нет оборудования для инвентаризации');
                setLoading(false);
                return;
            }
            setGroupedInventarizations(response.data);
            setInProgress(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка начала инвентаризации');
        } finally {
            setLoading(false);
        }
    };

    const handlePerformStep = async (invId, actualCount) => {
        if (actualCount === undefined || actualCount === null || actualCount < 0) {
            setError('Введите корректное количество');
            return;
        }
        setLoading(true);
        try {
            await inventarizationService.performStep(invId, actualCount);
            if (isAllMode) {
                const updatedGroups = groupedInventarizations.map(group => ({
                    ...group,
                    items: group.items.map(item => 
                        item.id === invId ? { ...item, realCount: actualCount } : item
                    )
                }));
                setGroupedInventarizations(updatedGroups);
            } else {
                const updated = inventarizations.map(inv => 
                    inv.id === invId ? { ...inv, realCount: actualCount } : inv
                );
                setInventarizations(updated);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка выполнения шага');
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            let response;
            if (isAllMode) {
                response = await inventarizationService.finishAll();
            } else {
                response = await inventarizationService.finish(selectedZone);
            }
            // Обновляем историю после завершения
            await loadHistory();
            setInProgress(false);
            setInventarizations([]);
            setGroupedInventarizations([]);
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка завершения инвентаризации');
        } finally {
            setLoading(false);
        }
    };

    const getEquipmentName = (invNumber) => {
        const eq = equipment.find(e => e.id === invNumber);
        return eq ? eq.name : 'Неизвестно';
    };

    const getZoneName = (zoneId) => {
        if (!zoneId) return 'Все зоны';
        const zone = zones.find(z => z.id === zoneId);
        return zone ? zone.name : `Зона ${zoneId}`;
    };

    const getRemainingCount = () => {
        if (isAllMode) {
            let count = 0;
            groupedInventarizations.forEach(group => {
                group.items.forEach(item => {
                    if (item.realCount === null || item.realCount === undefined) count++;
                });
            });
            return count;
        } else {
            return inventarizations.filter(inv => inv.realCount === null || inv.realCount === undefined).length;
        }
    };

    const getTotalCount = () => {
        if (isAllMode) {
            let count = 0;
            groupedInventarizations.forEach(group => {
                count += group.items.length;
            });
            return count;
        } else {
            return inventarizations.length;
        }
    };

    const remainingCount = getRemainingCount();
    const totalCount = getTotalCount();

    const styles = {
        ...commonStyles,
        zoneGroup: { marginTop: '1.5rem', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#e9ecef', borderRadius: '4px', fontWeight: 'bold' },
        subTable: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', marginBottom: '1rem' },
        input: { width: '100px', padding: '0.25rem', border: '1px solid #ccc', borderRadius: '4px' },
        progressBar: { marginTop: '1rem', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#e9ecef', borderRadius: '4px' },
        reportContainer: { marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px', marginBottom: '1rem' },
        reportsContainer: { marginTop: '2rem' },
        historyTitle: { marginTop: '2rem', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' },
        buttonGroup: { display: 'flex', gap: '1rem', alignItems: 'flex-end' },
        reportHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
        reportDate: { fontSize: '0.85rem', color: '#6c757d' },
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Инвентаризация оборудования</h1>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            {!inProgress && (
                <div style={styles.formContainer}>
                    <h3>Начать новую инвентаризацию</h3>
                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Зона (для частичной инвентаризации)</label>
                            <select style={styles.select} value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)}>
                                <option value="">Выберите зону</option>
                                {zones.map(zone => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
                            </select>
                        </div>
                        <div style={styles.buttonGroup}>
                            <button style={styles.button} onClick={handleStart} disabled={!selectedZone || loading}>
                                {loading ? 'Загрузка...' : 'По зоне'}
                            </button>
                            <button style={styles.successBtn} onClick={handleStartAll} disabled={loading}>
                                {loading ? 'Загрузка...' : 'По всему оборудованию'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {inProgress && totalCount > 0 && (
                <>
                    <div style={styles.progressBar}>
                        <strong>Прогресс:</strong> {totalCount - remainingCount} из {totalCount} проверено
                    </div>

                    <h3>Пошаговая сверка</h3>
                    
                    {!isAllMode && (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Инв. номер</th>
                                        <th style={styles.th}>Оборудование</th>
                                        <th style={styles.th}>Ожидаемое количество</th>
                                        <th style={styles.th}>Фактическое количество</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventarizations.map((inv) => (
                                        <tr key={inv.id}>
                                            <td style={styles.td}>{inv.equipmentInventoryNumber}</td>
                                            <td style={styles.td}>{getEquipmentName(inv.equipmentInventoryNumber)}</td>
                                            <td style={styles.td}>{inv.count}</td>
                                            <td style={styles.td}>
                                                {inv.realCount !== null && inv.realCount !== undefined ? (
                                                    inv.realCount
                                                ) : (
                                                    <input
                                                        type="number"
                                                        style={styles.input}
                                                        min="0"
                                                        placeholder="Введите"
                                                        onBlur={(e) => handlePerformStep(inv.id, parseInt(e.target.value))}
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {isAllMode && groupedInventarizations.map((group) => (
                        <div key={group.zoneId}>
                            <div style={styles.zoneGroup}>
                                Зона: {group.zoneName || `ID: ${group.zoneId}`}
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={styles.subTable}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>Инв. номер</th>
                                            <th style={styles.th}>Оборудование</th>
                                            <th style={styles.th}>Ожидаемое количество</th>
                                            <th style={styles.th}>Фактическое количество</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {group.items && group.items.map((inv) => (
                                            <tr key={inv.equipmentInventoryNumber}>
                                                <td style={styles.td}>{inv.equipmentInventoryNumber}</td>
                                                <td style={styles.td}>{getEquipmentName(inv.equipmentInventoryNumber)}</td>
                                                <td style={styles.td}>{inv.count}</td>
                                                <td style={styles.td}>
                                                    {inv.realCount !== null && inv.realCount !== undefined ? (
                                                        inv.realCount
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            style={styles.input}
                                                            min="0"
                                                            placeholder="Введите"
                                                            onBlur={(e) => handlePerformStep(inv.id, parseInt(e.target.value))}
                                                        />
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}

                    {remainingCount === 0 && (
                        <div style={{ marginTop: '1rem' }}>
                            <button style={styles.successBtn} onClick={handleFinish}>
                                Завершить инвентаризацию
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* История инвентаризаций */}
            <div style={styles.reportsContainer}>
                <h2 style={styles.historyTitle}>История инвентаризаций</h2>
                {reports.length === 0 ? (
                    <div style={styles.emptyMessage}>
                        Нет завершённых инвентаризаций
                    </div>
                ) : (
                    reports.map((report, idx) => (
                        <div key={idx} style={styles.reportContainer}>
                            <div style={styles.reportHeader}>
                                <strong>Инвентаризация #{reports.length - idx}</strong>
                                <span style={styles.reportDate}>Дата: {report.date}</span>
                            </div>
                            <p><strong>Зона:</strong> {getZoneName(report.zoneId)}</p>
                            <p><strong>Проверено единиц:</strong> {report.totalScanned}</p>
                            {report.discrepancies && report.discrepancies.length > 0 ? (
                                <>
                                    <strong>Расхождения:</strong>
                                    <ul>
                                        {report.discrepancies.map((d, i) => (
                                            <li key={i}>{d}</li>
                                        ))}
                                    </ul>
                                </>
                            ) : (
                                <p style={{ color: '#28a745' }}>✅ Расхождений не обнаружено</p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default InventarizationPage;