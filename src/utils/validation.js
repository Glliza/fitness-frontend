// Валидация для зон
export const validateZone = (data) => {
    const errors = {};
    if (!data.name || data.name.trim().length < 2) {
        errors.name = 'Название зоны должно быть не менее 2 символов';
    }
    if (data.name && data.name.length > 50) {
        errors.name = 'Название зоны не должно превышать 50 символов';
    }
    if (data.description && data.description.length > 100) {
        errors.description = 'Описание не должно превышать 100 символов';
    }
    if (!data.capacity || data.capacity <= 0) {
        errors.capacity = 'Вместимость должна быть больше 0';
    }
    if (data.floor === undefined || data.floor === null || data.floor < 0) {
        errors.floor = 'Этаж не может быть отрицательным';
    }
    return errors;
};

// Валидация для оборудования
export const validateEquipment = (data) => {
    const errors = {};
    if (!data.zoneId) {
        errors.zoneId = 'Выберите зону';
    }
    if (!data.name || data.name.trim().length < 2) {
        errors.name = 'Название оборудования должно быть не менее 2 символов';
    }
    if (data.name && data.name.length > 50) {
        errors.name = 'Название оборудования не должно превышать 50 символов';
    }
    if (!data.dataBuy) {
        errors.dataBuy = 'Выберите дату покупки';
    } else {
        const buyDate = new Date(data.dataBuy);
        const today = new Date();
        if (buyDate > today) {
            errors.dataBuy = 'Дата покупки не может быть в будущем';
        }
    }
    return errors;
};

// Валидация для расходников
export const validateConsumablesTransaction = (data) => {
    const errors = {};
    if (!data.consumableId) {
        errors.consumableId = 'Выберите расходный материал';
    }
    if (!data.zoneId) {
        errors.zoneId = 'Выберите зону';
    }
    if (!data.amount || data.amount <= 0) {
        errors.amount = 'Количество должно быть больше 0';
    }
    return errors;
};

// Валидация для заявки на закупку
export const validateRequestBuy = (data) => {
    const errors = {};
    if (!data.name || data.name.trim().length < 2) {
        errors.name = 'Наименование должно быть не менее 2 символов';
    }
    if (data.name && data.name.length > 50) {
        errors.name = 'Наименование не должно превышать 50 символов';
    }
    if (!data.count || data.count <= 0) {
        errors.count = 'Количество должно быть больше 0';
    }
    return errors;
};

// Валидация для ТО
export const validateTORepair = (data) => {
    const errors = {};
    if (!data.equipmentId) {
        errors.equipmentId = 'Выберите оборудование';
    }
    if (!data.type || data.type.trim().length === 0) {
        errors.type = 'Укажите тип ТО';
    }
    if (!data.plannedDate) {
        errors.plannedDate = 'Выберите плановую дату';
    } else {
        const planned = new Date(data.plannedDate);
        const today = new Date();
        if (planned < today) {
            errors.plannedDate = 'Дата ТО не может быть в прошлом';
        }
    }
    return errors;
};

// Валидация для заявки на ремонт
export const validateRequestRepair = (data) => {
    const errors = {};
    if (!data.equipmentInventoryNumber) {
        errors.equipmentInventoryNumber = 'Выберите оборудование';
    }
    if (!data.creator || data.creator.trim().length < 2) {
        errors.creator = 'Укажите, кто зафиксировал поломку (минимум 2 символа)';
    }
    if (data.description && data.description.length > 100) {
        errors.description = 'Описание не должно превышать 100 символов';
    }
    return errors;
};