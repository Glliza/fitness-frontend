import React, { useState, useEffect } from 'react';
import { consumablesService } from '../services/consumablesService';
import { zoneService } from '../services/zoneService';
import './ConsumablesPage.css';

const ConsumablesPage = () => {
    const [consumables, setConsumables] = useState([]);
    const [zones, setZones] = useState([]);
    const [balances, setBalances] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedConsumable, setSelectedConsumable] = useState('');
    const [selectedZone, setSelectedZone] = useState('');
    const [amount, setAmount] = useState('');
    const [transactionType, setTransactionType] = useState('income');
    
    const [consumablesPage, setConsumablesPage] = useState(0);
    const [consumablesTotalPages, setConsumablesTotalPages] = useState(0);
    const [consumablesTotalElements, setConsumablesTotalElements] = useState(0);
    const [consumablesPageSize] = useState(10);
    
    const [zonesPage, setZonesPage] = useState(0);
    const [zonesTotalPages, setZonesTotalPages] = useState(0);
    const [zonesTotalElements, setZonesTotalElements] = useState(0);
    const [zonesPageSize] = useState(10);

    const loadData = async () => {
        try {
            setLoading(true);
            const [consumablesRes, zonesRes] = await Promise.all([
                consumablesService.getAll(consumablesPage, consumablesPageSize),
                zoneService.getAll(zonesPage, zonesPageSize)
            ]);
            
            setConsumables(consumablesRes.data.content);
            setConsumablesTotalPages(consumablesRes.data.totalPages);
            setConsumablesTotalElements(consumablesRes.data.totalElements);
            
            setZones(zonesRes.data.content);
            setZonesTotalPages(zonesRes.data.totalPages);
            setZonesTotalElements(zonesRes.data.totalElements);
            
            await loadBalances(consumablesRes.data.content, zonesRes.data.content);
            setError('');
        } catch (err) {
            setError('Ошибка загрузки данных');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadBalances = async (consumablesList, zonesList) => {
        const newBalances = {};
        for (const consumable of consumablesList) {
            for (const zone of zonesList) {
                try {
                    const response = await consumablesService.getBalance(consumable.id, zone.id);
                    newBalances[`${consumable.id}_${zone.id}`] = response.data;
                } catch (err) {
                    newBalances[`${consumable.id}_${zone.id}`] = 0;
                }
            }
        }
        setBalances(newBalances);
    };

    useEffect(() => {
        loadData();
    }, [consumablesPage, zonesPage]);

    const handleTransaction = async (e) => {
        e.preventDefault();
        if (!selectedConsumable || !selectedZone || !amount || amount <= 0) {
            setError('Заполните все поля');
            return;
        }

        try {
            if (transactionType === 'income') {
                await consumablesService.addIncome(selectedConsumable, selectedZone, parseInt(amount));
            } else {
                await consumablesService.addExpense(selectedConsumable, selectedZone, parseInt(amount));
            }
            setAmount('');
            await loadBalances(consumables, zones);
            setError('');
        } catch (err) {
            const errorMessage = err.response?.data?.message || '';
            const match = errorMessage.match(/Available: (\d+), requested: (\d+)/);
            if (match) {
                const available = match[1];
                const requested = match[2];
                setError(`Недостаточно материала. Доступно: ${available}, запрошено: ${requested}`);
            } else if (errorMessage === 'No stock found') {
                setError('В выбранной зоне нет этого материала');
            } else {
                setError(errorMessage || 'Ошибка операции');
            }
        }
    };

    const handleExport = async (format) => {
        try {
            const response = await consumablesService.exportReport(format);
            
            let fileExtension = format;
            let mimeType = '';
            
            if (format === 'pdf') {
                fileExtension = 'pdf';
                mimeType = 'application/pdf';
            } else if (format === 'excel') {
                fileExtension = 'xlsx';
                mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            }
            
            const url = window.URL.createObjectURL(new Blob([response.data], { type: mimeType }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `consumables_report.${fileExtension}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export error:', err);
            setError('Ошибка экспорта');
        }
    };

    const getBalance = (consumableId, zoneId) => {
        return balances[`${consumableId}_${zoneId}`] || 0;
    };

    const renderConsumablesPagination = () => {
        if (consumablesTotalPages <= 1) return null;
        
        const pages = [];
        const maxVisible = 5;
        let startPage = Math.max(0, consumablesPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(consumablesTotalPages - 1, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(0, endPage - maxVisible + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        
        return (
            <div className="consumables-pagination">
                <button className="consumables-page-button" onClick={() => setConsumablesPage(0)} disabled={consumablesPage === 0}>
                    ⏮ Первая
                </button>
                <button className="consumables-page-button" onClick={() => setConsumablesPage(consumablesPage - 1)} disabled={consumablesPage === 0}>
                    ◀ Назад
                </button>
                {startPage > 0 && <span className="consumables-page-info">...</span>}
                {pages.map(p => (
                    <button key={p} className={p === consumablesPage ? "consumables-active-page-button" : "consumables-page-button"} onClick={() => setConsumablesPage(p)}>
                        {p + 1}
                    </button>
                ))}
                {endPage < consumablesTotalPages - 1 && <span className="consumables-page-info">...</span>}
                <button className="consumables-page-button" onClick={() => setConsumablesPage(consumablesPage + 1)} disabled={consumablesPage === consumablesTotalPages - 1}>
                    Вперед ▶
                </button>
                <button className="consumables-page-button" onClick={() => setConsumablesPage(consumablesTotalPages - 1)} disabled={consumablesPage === consumablesTotalPages - 1}>
                    Последняя ⏩
                </button>
                <span className="consumables-page-info">
                    Расходники: стр. {consumablesPage + 1} из {consumablesTotalPages} (всего {consumablesTotalElements})
                </span>
            </div>
        );
    };

    const renderZonesPagination = () => {
        if (zonesTotalPages <= 1) return null;
        
        const pages = [];
        const maxVisible = 5;
        let startPage = Math.max(0, zonesPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(zonesTotalPages - 1, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(0, endPage - maxVisible + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        
        return (
            <div className="consumables-pagination">
                <button className="consumables-page-button" onClick={() => setZonesPage(0)} disabled={zonesPage === 0}>
                    ⏮ Первая
                </button>
                <button className="consumables-page-button" onClick={() => setZonesPage(zonesPage - 1)} disabled={zonesPage === 0}>
                    ◀ Назад
                </button>
                {startPage > 0 && <span className="consumables-page-info">...</span>}
                {pages.map(p => (
                    <button key={p} className={p === zonesPage ? "consumables-active-page-button" : "consumables-page-button"} onClick={() => setZonesPage(p)}>
                        {p + 1}
                    </button>
                ))}
                {endPage < zonesTotalPages - 1 && <span className="consumables-page-info">...</span>}
                <button className="consumables-page-button" onClick={() => setZonesPage(zonesPage + 1)} disabled={zonesPage === zonesTotalPages - 1}>
                    Вперед ▶
                </button>
                <button className="consumables-page-button" onClick={() => setZonesPage(zonesTotalPages - 1)} disabled={zonesPage === zonesTotalPages - 1}>
                    Последняя ⏩
                </button>
                <span className="consumables-page-info">
                    Зоны: стр. {zonesPage + 1} из {zonesTotalPages} (всего {zonesTotalElements})
                </span>
            </div>
        );
    };

    return (
        <div className="consumables-container">
            <div className="consumables-header">
                <h1 className="consumables-title">Учёт расходных материалов</h1>
                <div>
                    <button className="consumables-export-btn" onClick={() => handleExport('pdf')}>Экспорт PDF</button>
                    <button className="consumables-export-btn" onClick={() => handleExport('excel')}>Экспорт Excel</button>
                </div>
            </div>

            {error && <div className="consumables-error">{error}</div>}

            <div className="consumables-form-container">
                <form onSubmit={handleTransaction}>
                    <div className="consumables-form-row">
                        <div className="consumables-form-group">
                            <label className="consumables-label">Зона</label>
                            <select
                                className="consumables-select"
                                value={selectedZone}
                                onChange={(e) => setSelectedZone(parseInt(e.target.value))}
                                required
                            >
                                <option value="">Выберите</option>
                                {zones.map(z => (
                                    <option key={z.id} value={z.id}>{z.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="consumables-form-group">
                            <label className="consumables-label">Расходный материал</label>
                            <select
                                className="consumables-select"
                                value={selectedConsumable}
                                onChange={(e) => setSelectedConsumable(parseInt(e.target.value))}
                                required
                            >
                                <option value="">Выберите</option>
                                {consumables.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="consumables-form-group">
                            <label className="consumables-label">Количество</label>
                            <input
                                type="number"
                                className="consumables-input"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="1"
                                required
                            />
                        </div>
                        <div className="consumables-form-group">
                            <label className="consumables-label">Тип операции</label>
                            <select
                                className="consumables-select"
                                value={transactionType}
                                onChange={(e) => setTransactionType(e.target.value)}
                            >
                                <option value="income">Приход</option>
                                <option value="expense">Расход</option>
                            </select>
                        </div>
                        <div>
                            <button type="submit" className={transactionType === 'income' ? "consumables-button" : "consumables-expense-btn"}>
                                {transactionType === 'income' ? 'Приход' : 'Расход'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {renderConsumablesPagination()}

            {loading ? (
                <p>Загрузка...</p>
            ) : (
                <div className="consumables-table-wrapper">
                    <table className="consumables-table">
                        <thead>
                            <tr>
                                {/* ИСПРАВЛЕНИЕ ЗДЕСЬ: Используем класс consumables-first-col для заголовка */}
                                <th className="consumables-first-col">Зона / Расходник</th>
                                
                                {consumables.map(consumable => (
                                    // Для остальных заголовков можно оставить пустой класс или стандартный th
                                    <th key={consumable.id}>{consumable.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {zones.map(zone => (
                                <tr key={zone.id}>
                                    <td className="consumables-first-col">{zone.name}</td>
                                    {consumables.map(consumable => (
                                        <td key={consumable.id} className="consumables-table td">
                                            {getBalance(consumable.id, zone.id)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {renderZonesPagination()}
        </div>
    );
};

export default ConsumablesPage;