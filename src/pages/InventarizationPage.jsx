import React, { useState, useEffect } from 'react';
import { inventarizationService } from '../services/inventarizationService';
import { zoneService } from '../services/zoneService';
import { equipmentService } from '../services/equipmentService';
import './InventarizationPage.css';

const InventarizationPage = () => {
    const [zones, setZones] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [inventarizations, setInventarizations] = useState([]);
    const [groupedInventarizations, setGroupedInventarizations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedZone, setSelectedZone] = useState('');
    const [reports, setReports] = useState([]);
    const [inProgress, setInProgress] = useState(false);
    const [isAllMode, setIsAllMode] = useState(false);
    
    const [historyPage, setHistoryPage] = useState(0);
    const [historyTotalPages, setHistoryTotalPages] = useState(0);
    const [historyTotalElements, setHistoryTotalElements] = useState(0);
    const [historyPageSize] = useState(10);

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

    const loadHistory = async (page = historyPage) => {
        try {
            const response = await inventarizationService.getHistory(page, historyPageSize);
            setReports(response.data.content);
            setHistoryTotalPages(response.data.totalPages);
            setHistoryTotalElements(response.data.totalElements);
            setHistoryPage(response.data.number);
        } catch (err) {
            console.error('Ошибка загрузки истории:', err);
        }
    };

    useEffect(() => {
        loadZones();
        loadEquipment();
        loadHistory(0);
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
            if (isAllMode) {
                await inventarizationService.finishAll();
            } else {
                await inventarizationService.finish(selectedZone);
            }
            await loadHistory(0);
            setInProgress(false);
            setInventarizations([]);
            setGroupedInventarizations([]);
            setHistoryPage(0);
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

    const handleHistoryPageChange = (newPage) => {
        if (newPage >= 0 && newPage < historyTotalPages) {
            loadHistory(newPage);
        }
    };

    const renderHistoryPagination = () => {
        if (historyTotalPages <= 1) return null;
        
        const pages = [];
        const maxVisible = 5;
        let startPage = Math.max(0, historyPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(historyTotalPages - 1, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(0, endPage - maxVisible + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        
        return (
            <div className="inventarization-pagination">
                <button className="inventarization-page-button" onClick={() => handleHistoryPageChange(0)} disabled={historyPage === 0}>
                    ⏮ Первая
                </button>
                <button className="inventarization-page-button" onClick={() => handleHistoryPageChange(historyPage - 1)} disabled={historyPage === 0}>
                    ◀ Назад
                </button>
                {startPage > 0 && <span className="inventarization-page-info">...</span>}
                {pages.map(p => (
                    <button key={p} className={p === historyPage ? "inventarization-active-page-button" : "inventarization-page-button"} onClick={() => handleHistoryPageChange(p)}>
                        {p + 1}
                    </button>
                ))}
                {endPage < historyTotalPages - 1 && <span className="inventarization-page-info">...</span>}
                <button className="inventarization-page-button" onClick={() => handleHistoryPageChange(historyPage + 1)} disabled={historyPage === historyTotalPages - 1}>
                    Вперед ▶
                </button>
                <button className="inventarization-page-button" onClick={() => handleHistoryPageChange(historyTotalPages - 1)} disabled={historyPage === historyTotalPages - 1}>
                    Последняя ⏩
                </button>
                <span className="inventarization-page-info">
                    Страница {historyPage + 1} из {historyTotalPages} (всего {historyTotalElements} записей)
                </span>
            </div>
        );
    };

    return (
        <div className="inventarization-container">
            <div className="inventarization-header">
                <h1 className="inventarization-title">Инвентаризация оборудования</h1>
            </div>

            {error && <div className="inventarization-error">{error}</div>}

            {!inProgress && (
                <div className="inventarization-form-container">
                    <h3>Начать новую инвентаризацию</h3>
                    <div className="inventarization-form-row">
                        <div className="inventarization-form-group">
                            <label className="inventarization-label">Зона (для частичной инвентаризации)</label>
                            <select className="inventarization-select" value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)}>
                                <option value="">Выберите зону</option>
                                {zones.map(zone => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
                            </select>
                        </div>
                        <div className="inventarization-button-group">
                            <button className="inventarization-button" onClick={handleStart} disabled={!selectedZone || loading}>
                                {loading ? 'Загрузка...' : 'По зоне'}
                            </button>
                            <button className="inventarization-success-btn" onClick={handleStartAll} disabled={loading}>
                                {loading ? 'Загрузка...' : 'По всему оборудованию'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {inProgress && totalCount > 0 && (
                <>
                    <div className="inventarization-progress-bar">
                        <strong>Прогресс:</strong> {totalCount - remainingCount} из {totalCount} проверено
                    </div>

                    <h3>Пошаговая сверка</h3>
                    
                    {!isAllMode && (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="inventarization-table">
                                <thead>
                                    <tr>
                                        <th>Инв. номер</th>
                                        <th>Оборудование</th>
                                        <th>Ожидаемое количество</th>
                                        <th>Фактическое количество</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventarizations.map((inv) => (
                                        <tr key={inv.id}>
                                            <td>{inv.equipmentInventoryNumber}</td>
                                            <td>{getEquipmentName(inv.equipmentInventoryNumber)}</td>
                                            <td>{inv.count}</td>
                                            <td>
                                                {inv.realCount !== null && inv.realCount !== undefined ? (
                                                    inv.realCount
                                                ) : (
                                                    <input
                                                        type="number"
                                                        className="inventarization-input"
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
                            <div className="inventarization-zone-group">
                                Зона: {group.zoneName || `ID: ${group.zoneId}`}
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="inventarization-sub-table">
                                    <thead>
                                        <tr>
                                            <th>Инв. номер</th>
                                            <th>Оборудование</th>
                                            <th>Ожидаемое количество</th>
                                            <th>Фактическое количество</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {group.items && group.items.map((inv) => (
                                            <tr key={inv.equipmentInventoryNumber}>
                                                <td>{inv.equipmentInventoryNumber}</td>
                                                <td>{getEquipmentName(inv.equipmentInventoryNumber)}</td>
                                                <td>{inv.count}</td>
                                                <td>
                                                    {inv.realCount !== null && inv.realCount !== undefined ? (
                                                        inv.realCount
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            className="inventarization-input"
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
                            <button className="inventarization-success-btn" onClick={handleFinish}>
                                Завершить инвентаризацию
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* ... внутри return ... */}
            {!inProgress && (
                <div>
                    <h2 className="inventarization-history-title">История инвентаризаций</h2>
                    {reports.length === 0 ? (
                        <div className="inventarization-empty-message">
                            Нет завершённых инвентаризаций
                        </div>
                    ) : (
                        <>
                            <table className="inventarization-table">
                                <thead>
                                    <tr>
                                        <th>№</th>
                                        <th>Дата</th>
                                        <th>Зона</th>
                                        <th>Проверено единиц</th>
                                        <th>Расхождения</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((report, idx) => (
                                        <tr key={report.sessionId || idx}> {/* Используем sessionId как ключ */}
                                            <td>{(historyPage * historyPageSize) + idx + 1}</td>
                                            <td>{report.date}</td>
                                            <td>{report.zoneName || getZoneName(report.zoneId)}</td> {/* Используем zoneName из отчета */}
                                            <td>{report.totalScanned}</td>
                                            <td>
                                                {report.discrepancies && report.discrepancies.length > 0 ? (
                                                    <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                                                        {report.discrepancies.map((d, i) => (
                                                            <li key={i}>{d}</li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <span style={{ color: '#28a745' }}>Нет расхождений</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {renderHistoryPagination()}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default InventarizationPage;