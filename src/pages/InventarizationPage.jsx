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
    const [report, setReport] = useState(null);
    const [inProgress, setInProgress] = useState(false);
    const [isAllMode, setIsAllMode] = useState(false);
    const [invIdMap, setInvIdMap] = useState({});

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
            const response = await equipmentService.getAllList();
            setEquipment(response.data.content || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadZones();
        loadEquipment();
    }, []);

    const handleStart = async () => {
        if (!selectedZone) {
            setError('Выберите зону');
            return;
        }
        setLoading(true);
        setError('');
        setReport(null);
        setIsAllMode(false);
        try {
            const response = await inventarizationService.start(selectedZone);
            setInventarizations(response.data);
            setInProgress(true);
        } catch (err) {
            setError('Ошибка начала инвентаризации');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStartAll = async () => {
        setLoading(true);
        setError('');
        setReport(null);
        setIsAllMode(true);
        try {
            const response = await inventarizationService.startAll();
            console.log('startAll response:', response.data);
            setGroupedInventarizations(response.data);
            const allItems = [];
            const newInvIdMap = {};
            
            response.data.forEach(group => {
                if (group.items && group.items.length > 0) {
                    group.items.forEach(item => {
                        allItems.push({
                            ...item,
                            zoneId: group.zoneId,
                            zoneName: group.zoneName,
                            id: item.id || item.equipmentInventoryNumber
                        });
                        if (item.id) {
                            newInvIdMap[item.equipmentInventoryNumber] = item.id;
                        }
                    });
                }
            });
            
            setInventarizations(allItems);
            setInvIdMap(newInvIdMap);
            setInProgress(true);
        } catch (err) {
            setError('Ошибка начала инвентаризации');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePerformStep = async (invId, equipmentInventoryNumber, actualCount) => {
        setLoading(true);
        try {
            let stepId = invId;
            if (!stepId || stepId === 'undefined') {
                stepId = invIdMap[equipmentInventoryNumber];
            }
            if (!stepId) {
                const found = inventarizations.find(inv => inv.equipmentInventoryNumber === equipmentInventoryNumber);
                stepId = found?.id;
            }
            if (!stepId) {
                setError('Не удалось определить ID инвентаризации');
                setLoading(false);
                return;
            }
            
            await inventarizationService.performStep(stepId, actualCount);
            
            const updated = inventarizations.map(inv => 
                (inv.id === stepId || inv.equipmentInventoryNumber === equipmentInventoryNumber) 
                    ? { ...inv, realCount: actualCount } 
                    : inv
            );
            setInventarizations(updated);
            
            if (isAllMode) {
                const updatedGroups = groupedInventarizations.map(group => ({
                    ...group,
                    items: group.items.map(item => 
                        (item.id === stepId || item.equipmentInventoryNumber === equipmentInventoryNumber)
                            ? { ...item, realCount: actualCount }
                            : item
                    )
                }));
                setGroupedInventarizations(updatedGroups);
            }
        } catch (err) {
            setError('Ошибка выполнения шага');
            console.error(err);
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
            setReport(response.data);
            setInProgress(false);
        } catch (err) {
            setError('Ошибка завершения инвентаризации');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getEquipmentName = (invNumber) => {
        const eq = equipment.find(e => e.id === invNumber);
        return eq ? eq.name : 'Неизвестно';
    };

    const remainingCount = inventarizations.filter(inv => inv.realCount === null || inv.realCount === undefined).length;

    const styles = {
        ...commonStyles,
        zoneGroup: { marginTop: '1.5rem', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#e9ecef', borderRadius: '4px', fontWeight: 'bold' },
        subTable: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', marginBottom: '1rem' },
        input: { width: '100px', padding: '0.25rem', border: '1px solid #ccc', borderRadius: '4px' },
        progressBar: { marginTop: '1rem', padding: '0.5rem', backgroundColor: '#e9ecef', borderRadius: '4px' },
        reportContainer: { marginTop: '2rem', padding: '1rem', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '8px' },
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Инвентаризация оборудования</h1>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            {!inProgress && (
                <div style={styles.formContainer}>
                    <h3>Начать инвентаризацию</h3>
                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Зона (для частичной инвентаризации)</label>
                            <select style={styles.select} value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)}>
                                <option value="">Выберите зону</option>
                                {zones.map(zone => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <button style={styles.button} onClick={handleStart} disabled={!selectedZone}>
                                По зоне
                            </button>
                            <button style={styles.successBtn} onClick={handleStartAll}>
                                По всему оборудованию
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {inProgress && inventarizations.length > 0 && (
                <>
                    <div style={styles.progressBar}>
                        <strong>Прогресс:</strong> {inventarizations.length - remainingCount} из {inventarizations.length} проверено
                    </div>

                    <h3>Пошаговая сверка</h3>
                    
                    {!isAllMode && (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Инв. номер</th>
                                    <th style={styles.th}>Оборудование</th>
                                    <th style={styles.th}>Ожидаемое количество</th>
                                    <th style={styles.th}>Фактическое количество</th>
                                    <th style={styles.th}>Действие</th>
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
                                                    onBlur={(e) => handlePerformStep(inv.id, inv.equipmentInventoryNumber, parseInt(e.target.value))}
                                                />
                                            )}
                                        </td>
                                        <td style={styles.td}>
                                            {inv.realCount === null && (
                                                <span>Ожидает проверки</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {isAllMode && groupedInventarizations.map((group) => (
                        <div key={group.zoneId}>
                            <div style={styles.zoneGroup}>
                                Зона: {group.zoneName || `ID: ${group.zoneId}`}
                            </div>
                            <table style={styles.subTable}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Инв. номер</th>
                                        <th style={styles.th}>Оборудование</th>
                                        <th style={styles.th}>Ожидаемое количество</th>
                                        <th style={styles.th}>Фактическое количество</th>
                                        <th style={styles.th}>Действие</th>
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
                                                        onBlur={(e) => handlePerformStep(inv.id, inv.equipmentInventoryNumber, parseInt(e.target.value))}
                                                    />
                                                )}
                                            </td>
                                            <td style={styles.td}>
                                                {inv.realCount === null && (
                                                    <span>Ожидает проверки</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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

            {report && (
                <div style={styles.reportContainer}>
                    <h3>Отчёт о расхождениях</h3>
                    <p><strong>Зона:</strong> {report.zoneId ? zones.find(z => z.id === report.zoneId)?.name || report.zoneId : 'Все зоны'}</p>
                    <p><strong>Проверено единиц:</strong> {report.totalScanned}</p>
                    <p><strong>Дата:</strong> {report.date}</p>
                    {report.discrepancies && report.discrepancies.length > 0 ? (
                        <>
                            <h4>Расхождения:</h4>
                            <ul>
                                {report.discrepancies.map((d, i) => <li key={i}>{d}</li>)}
                            </ul>
                        </>
                    ) : (
                        <p style={{ color: '#28a745' }}>Расхождений не обнаружено</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default InventarizationPage;