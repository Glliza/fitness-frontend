import React, { useState, useEffect } from 'react';
import { zoneService } from '../services/zoneService';

const ZonesPage = () => {
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        userid: 1,
        name: '',
        description: '',
        capacity: '',
        floor: '',
    });

    const loadZones = async () => {
        try {
            setLoading(true);
            const response = await zoneService.getAll();
            setZones(response.data);
            setError('');
        } catch (err) {
            setError('Ошибка загрузки зон');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadZones();
    }, []);

    const resetForm = () => {
        setFormData({
            userid: 1,
            name: '',
            description: '',
            capacity: '',
            floor: '',
        });
        setIsEditing(false);
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (zone) => {
        setFormData({
            userid: zone.userid || 1,
            name: zone.name,
            description: zone.description || '',
            capacity: zone.capacity,
            floor: zone.floor,
        });
        setIsEditing(true);
        setEditingId(zone.id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await zoneService.update(editingId, formData);
            } else {
                await zoneService.create(formData);
            }
            resetForm();
            loadZones();
        } catch (err) {
            setError(isEditing ? 'Ошибка обновления зоны' : 'Ошибка создания зоны');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Удалить зону?')) {
            try {
                await zoneService.delete(id);
                loadZones();
            } catch (err) {
                setError(err.response?.data?.message || 'Ошибка удаления');
            }
        }
    };

    const styles = {
        container: { padding: '2rem' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
        table: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' },
        th: { border: '1px solid #ddd', padding: '0.75rem', textAlign: 'left', backgroundColor: '#f2f2f2' },
        td: { border: '1px solid #ddd', padding: '0.75rem' },
        button: { backgroundColor: '#007bff', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' },
        editBtn: { backgroundColor: '#ffc107', color: 'black', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem' },
        deleteBtn: { backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' },
        cancelBtn: { backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', marginLeft: '0.5rem' },
        formContainer: { marginTop: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white' },
        formRow: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
        formGroup: { flex: 1, minWidth: '200px' },
        label: { display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' },
        input: { width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' },
        error: { backgroundColor: '#f8d7da', color: '#721c24', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' },
        success: { backgroundColor: '#d4edda', color: '#155724', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' },
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1>Управление зонами</h1>
                {!showForm && (
                    <button style={styles.button} onClick={() => setShowForm(true)}>
                        + Добавить зону
                    </button>
                )}
            </div>

            {error && <div style={styles.error}>{error}</div>}

            {showForm && (
                <div style={styles.formContainer}>
                    <h3>{isEditing ? 'Редактирование зоны' : 'Новая зона'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Название *</label>
                                <input
                                    type="text"
                                    placeholder="Введите название"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Описание</label>
                                <input
                                    type="text"
                                    placeholder="Введите описание"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    style={styles.input}
                                />
                            </div>
                        </div>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Вместимость *</label>
                                <input
                                    type="number"
                                    placeholder="Введите вместимость"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                    required
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Этаж *</label>
                                <input
                                    type="number"
                                    placeholder="Введите этаж"
                                    value={formData.floor}
                                    onChange={(e) => setFormData({ ...formData, floor: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                    required
                                    style={styles.input}
                                />
                            </div>
                        </div>
                        <div>
                            <button type="submit" style={styles.button}>
                                {isEditing ? 'Обновить' : 'Сохранить'}
                            </button>
                            <button type="button" style={styles.cancelBtn} onClick={resetForm}>
                                Отмена
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <p>Загрузка...</p>
            ) : (
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}>Название</th>
                            <th style={styles.th}>Описание</th>
                            <th style={styles.th}>Вместимость</th>
                            <th style={styles.th}>Этаж</th>
                            <th style={styles.th}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {zones.map((zone) => (
                            <tr key={zone.id}>
                                <td style={styles.td}>{zone.id}</td>
                                <td style={styles.td}>{zone.name}</td>
                                <td style={styles.td}>{zone.description || '-'}</td>
                                <td style={styles.td}>{zone.capacity}</td>
                                <td style={styles.td}>{zone.floor}</td>
                                <td style={styles.td}>
                                    <button style={styles.editBtn} onClick={() => handleEdit(zone)}>
                                        Изменить
                                    </button>
                                    <button style={styles.deleteBtn} onClick={() => handleDelete(zone.id)}>
                                        Удалить
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ZonesPage;