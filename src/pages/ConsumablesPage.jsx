import React, { useState, useEffect } from 'react';
import { consumablesService } from '../services/consumablesService';
import { zoneService } from '../services/zoneService';

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

    const loadData = async () => {
        try {
            setLoading(true);
            const [consumablesRes, zonesRes] = await Promise.all([
                consumablesService.getAll(),
                zoneService.getAll()
            ]);
            setConsumables(consumablesRes.data);
            setZones(zonesRes.data);
            await loadBalances(consumablesRes.data, zonesRes.data);
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
    }, []);

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
            setError(err.response?.data?.message || 'Ошибка операции');
        }
    };

    const handleExport = async (format) => {
        try {
            const response = await consumablesService.exportReport(format);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `consumables_report.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError('Ошибка экспорта');
        }
    };

    const getBalance = (consumableId, zoneId) => {
        return balances[`${consumableId}_${zoneId}`] || 0;
    };

    const styles = {
        container: { padding: '2rem' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
        formContainer: { padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white', marginBottom: '2rem' },
        formRow: { display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' },
        formGroup: { flex: 1, minWidth: '150px' },
        label: { display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' },
        select: { width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' },
        input: { width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' },
        button: { backgroundColor: '#007bff', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' },
        expenseBtn: { backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' },
        exportBtn: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', marginLeft: '0.5rem' },
        table: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' },
        th: { border: '1px solid #ddd', padding: '0.75rem', textAlign: 'left', backgroundColor: '#f2f2f2' },
        td: { border: '1px solid #ddd', padding: '0.75rem' },
        error: { backgroundColor: '#f8d7da', color: '#721c24', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' },
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1>Учёт расходных материалов</h1>
                <div>
                    <button style={styles.exportBtn} onClick={() => handleExport('pdf')}>Экспорт PDF</button>
                    <button style={styles.exportBtn} onClick={() => handleExport('excel')}>Экспорт Excel</button>
                </div>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.formContainer}>
                <form onSubmit={handleTransaction}>
                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Расходный материал</label>
                            <select
                                style={styles.select}
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
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Зона</label>
                            <select
                                style={styles.select}
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
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Количество</label>
                            <input
                                type="number"
                                style={styles.input}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="1"
                                required
                            />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Тип операции</label>
                            <select
                                style={styles.select}
                                value={transactionType}
                                onChange={(e) => setTransactionType(e.target.value)}
                            >
                                <option value="income">Приход</option>
                                <option value="expense">Расход</option>
                            </select>
                        </div>
                        <div>
                            <button type="submit" style={transactionType === 'income' ? styles.button : styles.expenseBtn}>
                                {transactionType === 'income' ? 'Приход' : 'Расход'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {loading ? (
                <p>Загрузка...</p>
            ) : (
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Расходный материал</th>
                            {zones.map(zone => (
                                <th key={zone.id} style={styles.th}>{zone.name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {consumables.map(consumable => (
                            <tr key={consumable.id}>
                                <td style={styles.td}><strong>{consumable.name}</strong></td>
                                {zones.map(zone => (
                                    <td key={zone.id} style={styles.td}>
                                        {getBalance(consumable.id, zone.id)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ConsumablesPage;