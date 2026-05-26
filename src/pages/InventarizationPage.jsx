import React, { useState, useEffect } from 'react';
import { inventarizationService } from '../services/inventarizationService';
import { zoneService } from '../services/zoneService';
import { equipmentService } from '../services/equipmentService';

const InventarizationPage = () => {
    const [zones, setZones] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [inventarizations, setInventarizations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedZone, setSelectedZone] = useState('');
    const [currentStep, setCurrentStep] = useState(null);
    const [report, setReport] = useState(null);
    const [inProgress, setInProgress] = useState(false);

    const loadZones = async () => {
        try {
            const response = await zoneService.getAll();
            setZones(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadEquipment = async () => {
        try {
            const response = await equipmentService.getAll();
            setEquipment(response.data);
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
        try {
            const response = await inventarizationService.start(selectedZone);
            setInventarizations(response.data);
            setInProgress(true);
            setCurrentStep(0);
        } catch (err) {
            setError('Ошибка начала инвентаризации');
        } finally {
            setLoading(false);
        }
    };

    const handleStartAll = async () => {
        setLoading(true);
        setError('');
        setReport(null);
        try {
            const response = await inventarizationService.startAll();
            setInventarizations(response.data);
            setInProgress(true);
            setCurrentStep(0);
        } catch (err) {
            setError('Ошибка начала инвентаризации');
        } finally {
            setLoading(false);
        }
    };

    const handlePerformStep = async (invId, actualCount) => {
        setLoading(true);
        try {
            await inventarizationService.performStep(invId, actualCount);
            const updated = inventarizations.map(inv => 
                inv.id === invId ? { ...inv, realCount: actualCount } : inv
            );
            setInventarizations(updated);
            setCurrentStep(currentStep + 1);
        } catch (err) {
            setError('Ошибка выполнения шага');
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            const response = await inventarizationService.finish(selectedZone);
            setReport(response.data);
            setInProgress(false);
        } catch (err) {
            setError('Ошибка завершения инвентаризации');
        } finally {
            setLoading(false);
        }
    };

    const handleFinishAll = async () => {
        setLoading(true);
        try {
            const response = await inventarizationService.finishAll();
            setReport(response.data);
            setInProgress(false);
        } catch (err) {
            setError('Ошибка завершения инвентаризации');
        } finally {
            setLoading(false);
        }
    };

    const getEquipmentName = (invNumber) => {
        const eq = equipment.find(e => e.id === invNumber);
        return eq ? eq.name : 'Неизвестно';
    };

    const styles = {
        container: { padding: '2rem' },
        header: { marginBottom: '2rem' },
        formContainer: { padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white', marginBottom: '2rem' },
        formRow: { display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' },
        formGroup: { flex: 1, minWidth: '200px' },
        label: { display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' },
        select: { width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' },
        button: { backgroundColor: '#007bff', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem' },
        successBtn: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' },
        table: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', marginTop: '1rem' },
        th: { border: '1px solid #ddd', padding: '0.75rem', textAlign: 'left', backgroundColor: '#f2f2f2' },
        td: { border: '1px solid #ddd', padding: '0.75rem' },
        input: { width: '100px', padding: '0.25rem', border: '1px solid #ccc', borderRadius: '4px' },
        reportContainer: { marginTop: '2rem', padding: '1rem', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '8px' },
        error: { backgroundColor: '#f8d7da', color: '#721c24', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' },
        progressBar: { marginTop: '1rem', padding: '0.5rem', backgroundColor: '#e9ecef', borderRadius: '4px' },
    };

    const remainingCount = inventarizations.filter(inv => inv.realCount === null || inv.realCount === undefined).length;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1>Инвентаризация оборудования</h1>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            {!inProgress && (
                <div style={styles.formContainer}>
                    <h3>Начать инвентаризацию</h3>
                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Зона (для частичной инвентаризации)</label>
                            <select style={styles.select} value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)}>
                                <option value="">Все зоны</option>
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
                                                onBlur={(e) => handlePerformStep(inv.id, parseInt(e.target.value))}
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

                    {remainingCount === 0 && (
                        <div style={{ marginTop: '1rem' }}>
                            <button style={styles.successBtn} onClick={selectedZone ? handleFinish : handleFinishAll}>
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