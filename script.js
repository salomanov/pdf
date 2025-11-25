pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

let formats = [];
const formatOrder = [
    "A0", "A0x2", "A0x3", "A0x4", "A0x5", "A0x6",
    "A1", "A1x3", "A1x4", "A1x5", "A1x6",
    "A2", "A2x3", "A2x4", "A2x5", "A2x6",
    "A3", "A3x3", "A3x4", "A3x5", "A3x6", "A3x7",
    "A4", "A4x3", "A4x4", "A4x5", "A4x6", "A4x7", "A4x8", "A4x9"
];

// Определение наборов цен
const PRICE_SETS = {
    bw: {
        pricePerSqM: 300,
        a4Prices: { '1_10': 10, '11_50': 8, '51_100': 6, '101_500': 5 },
        a3Prices: { '1_10': 20, '11_50': 16, '51_100': 12, '101_500': 10 }
    },
    color: {
        pricePerSqM: 300,
        a4Prices: { '1_10': 25, '11_50': 20, '51_100': 18, '101_500': 16 },
        a3Prices: { '1_10': 50, '11_50': 40, '51_100': 36, '101_500': 32 }
    }
};

let currentMode = 'bw'; // 'bw' или 'color'
let settings = { ...PRICE_SETS[currentMode] }; // Используем начальный набор

let filesData = new Map();
let formatStatistics = {};

document.addEventListener('DOMContentLoaded', async function () {
    try {
        await loadFormatsFromXML();
        await loadSettingsFromJSON();
        // Загружаем текущий режим из localStorage
        const savedMode = localStorage.getItem('pdfCalculatorMode');
        if (savedMode && (savedMode === 'bw' || savedMode === 'color')) {
            currentMode = savedMode;
            settings = { ...PRICE_SETS[currentMode] };
        }
        updateModeButtonDisplay();
    } catch (error) {
        console.error('Ошибка загрузки конфигурации:', error);
    } finally {
        initializeApp();
    }
});

async function loadFormatsFromXML() {
    const response = await fetch('formats.xml');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    formats = Array.from(xmlDoc.getElementsByTagName('format')).map(el => ({
        name: el.getAttribute('name'),
        minWidth: parseFloat(el.getAttribute('minWidth')),
        maxWidth: parseFloat(el.getAttribute('maxWidth')),
        minHeight: parseFloat(el.getAttribute('minHeight')),
        maxHeight: parseFloat(el.getAttribute('maxHeight'))
    }));
}

async function loadSettingsFromJSON() {
    try {
        const response = await fetch('settings.json');
        if (!response.ok) {
            // Если settings.json отсутствует, используем стандартные настройки
            console.warn('settings.json не найден, используются стандартные настройки.');
            return;
        }
        const defaultSettings = await response.json();
        // Объединяем стандартные настройки с возможными пользовательскими
        const saved = localStorage.getItem('pdfCalculatorSettings');
        if (saved) {
            const user = JSON.parse(saved);
            settings = {
                ...defaultSettings,
                ...user,
                a4Prices: { ...defaultSettings.a4Prices, ...user.a4Prices },
                a3Prices: { ...defaultSettings.a3Prices, ...user.a3Prices }
            };
            // Если пользовательские настройки были загружены, сохраняем их в текущий набор
            PRICE_SETS.bw = { ...settings };
        } else {
            settings = defaultSettings;
            PRICE_SETS.bw = { ...settings };
        }
    } catch (error) {
        console.error('Не удалось загрузить settings.json, используются стандартные значения:', error);
    }
}

function initializeApp() {
    // ... (DOM элементы без изменений) ...
    const dropArea = document.getElementById('dropArea');
    const browseBtn = document.getElementById('browseBtn');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const statsSection = document.getElementById('statsSection');
    const loading = document.getElementById('loading');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const saveSettingsBtn = document.getElementById('saveSettings');
    const currentSettingsEl = document.getElementById('currentSettings');
    const errorSection = document.getElementById('errorSection');
    const filesTotal = document.getElementById('filesTotal');
    const totalCostValue = document.getElementById('totalCostValue');
    const formatList = document.getElementById('formatList');
    const totalFilesCount = document.getElementById('totalFilesCount');
    const totalPagesCount = document.getElementById('totalPagesCount');
    const totalA4Pages = document.getElementById('totalA4Pages');
    const totalA3Pages = document.getElementById('totalA3Pages');
    // Новые элементы для кнопки режима
    const modeBtn = document.getElementById('modeBtn');
    const modeText = document.getElementById('modeText');

    updateCurrentSettingsDisplay();

    // ... (все функции без изменений до initEventHandlers) ...

    function initEventHandlers() {
        // ... (существующие обработчики) ...
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.add('drag-over'), false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.remove('drag-over'), false);
        });
        dropArea.addEventListener('drop', handleDrop, false);
        browseBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => handleFiles(fileInput.files));
        clearAllBtn.addEventListener('click', clearAllFiles);
        settingsBtn.addEventListener('click', openSettingsModal);
        [closeModal, cancelBtn].forEach(btn => btn.addEventListener('click', closeSettingsModal));
        saveSettingsBtn.addEventListener('click', saveSettings);
        // Новый обработчик для кнопки режима
        modeBtn.addEventListener('click', toggleMode);
    }

    // Функция переключения режима
    function toggleMode() {
        currentMode = currentMode === 'bw' ? 'color' : 'bw';
        settings = { ...PRICE_SETS[currentMode] };
        localStorage.setItem('pdfCalculatorMode', currentMode);
        updateModeButtonDisplay();
        updateCurrentSettingsDisplay();
        recalculateAllFiles();
    }

    function updateModeButtonDisplay() {
        const modeText = document.getElementById('modeText');
        modeText.textContent = currentMode === 'bw' ? 'Ч/Б' : 'Цвет';
    }

    // ... (остальные функции без изменений) ...

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        handleFiles(dt.files);
    }

    function openSettingsModal() {
        document.getElementById('pricePerSqM').value = settings.pricePerSqM;
        document.getElementById('a4_1_10').value = settings.a4Prices['1_10'];
        document.getElementById('a4_11_50').value = settings.a4Prices['11_50'];
        document.getElementById('a4_51_100').value = settings.a4Prices['51_100'];
        document.getElementById('a4_101_500').value = settings.a4Prices['101_500'];
        document.getElementById('a3_1_10').value = settings.a3Prices['1_10'];
        document.getElementById('a3_11_50').value = settings.a3Prices['11_50'];
        document.getElementById('a3_51_100').value = settings.a3Prices['51_100'];
        document.getElementById('a3_101_500').value = settings.a3Prices['101_500'];
        settingsModal.classList.add('active');
    }

    function closeSettingsModal() {
        settingsModal.classList.remove('active');
    }

    function saveSettings() {
        settings.pricePerSqM = parseFloat(document.getElementById('pricePerSqM').value) || 300;
        settings.a4Prices = {
            '1_10': parseFloat(document.getElementById('a4_1_10').value) || 10,
            '11_50': parseFloat(document.getElementById('a4_11_50').value) || 8,
            '51_100': parseFloat(document.getElementById('a4_51_100').value) || 6,
            '101_500': parseFloat(document.getElementById('a4_101_500').value) || 5
        };
        settings.a3Prices = {
            '1_10': parseFloat(document.getElementById('a3_1_10').value) || 20,
            '11_50': parseFloat(document.getElementById('a3_11_50').value) || 16,
            '51_100': parseFloat(document.getElementById('a3_51_100').value) || 12,
            '101_500': parseFloat(document.getElementById('a3_101_500').value) || 10
        };
        // Сохраняем в набор текущего режима
        PRICE_SETS[currentMode] = { ...settings };
        localStorage.setItem('pdfCalculatorSettings', JSON.stringify(settings));
        updateCurrentSettingsDisplay();
        recalculateAllFiles();
        closeSettingsModal();
    }

    function updateCurrentSettingsDisplay() {
        currentSettingsEl.textContent = `Текущая цена: А4/А3 - по количеству, другие форматы - ${settings.pricePerSqM / 100} руб./100 см²`;
    }

    function handleFiles(files) {
        if (!files.length) return;
        loading.style.display = 'block';
        errorSection.classList.add('hidden');
        Array.from(files).forEach(file => {
            if (file.type === 'application/pdf') {
                addFileToList(file);
                calculatePdfCost(file);
            }
        });
    }

    function addFileToList(file) {
        const fileId = Date.now() + Math.random().toString(36).substr(2, 9);
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.fileId = fileId;
        fileItem.innerHTML = `
            <div class="file-name" title="${file.name}">${file.name}</div>
            <div class="file-cost">0 руб.</div>
            <button class="remove-file" data-file-id="${fileId}">&times;</button>
        `;
        fileList.appendChild(fileItem);
        fileList.classList.remove('hidden');
        filesTotal.classList.remove('hidden');
        clearAllBtn.classList.remove('hidden');

        fileItem.querySelector('.remove-file').addEventListener('click', function () {
            const id = this.dataset.fileId;
            filesData.delete(id);
            fileItem.remove();
            updateTotalCost();
            updateStatistics();
            if (filesData.size === 0) {
                fileList.classList.add('hidden');
                filesTotal.classList.add('hidden');
                clearAllBtn.classList.add('hidden');
                statsSection.classList.add('hidden');
            }
        });

        filesData.set(fileId, {
            file: file,
            cost: 0,
            pages: 0,
            a4Pages: 0,
            a3Pages: 0,
            otherPages: 0,
            formatCounts: {}
        });
    }

    function calculatePdfCost(file) {
        const fileId = Array.from(filesData.entries()).find(([id, data]) => data.file === file)[0];
        const reader = new FileReader();
        reader.onload = function () {
            const typedArray = new Uint8Array(this.result);
            pdfjsLib.getDocument(typedArray).promise.then(pdf => {
                const numPages = pdf.numPages;
                let totalCost = 0;
                let a4Count = 0;
                let a3Count = 0;
                let otherCount = 0;
                const formatCounts = {};

                const pagePromises = [];
                for (let i = 1; i <= numPages; i++) {
                    pagePromises.push(
                        pdf.getPage(i).then(page => {
                            const { width, height } = page.getViewport({ scale: 1 });
                            const format = determineFormat(width, height);
                            formatCounts[format] = (formatCounts[format] || 0) + 1;
                            return { width, height, format };
                        })
                    );
                }

                Promise.all(pagePromises).then(pages => {
                    // Сначала подсчитываем A4/A3 в этом файле
                    pages.forEach(p => {
                        if (p.format === 'A4') a4Count++;
                        else if (p.format === 'A3') a3Count++;
                        else otherCount++;
                    });

                    // Теперь считаем стоимость с учётом количества внутри файла
                    pages.forEach(p => {
                        const cost = calculatePageCost(p.format, p.width, p.height, a4Count, a3Count);
                        totalCost += cost;
                    });

                    const data = filesData.get(fileId);
                    data.cost = totalCost;
                    data.pages = numPages;
                    data.a4Pages = a4Count;
                    data.a3Pages = a3Count;
                    data.otherPages = otherCount;
                    data.formatCounts = formatCounts;

                    updateFileDisplay(fileId, totalCost);
                    updateTotalCost();
                    updateStatistics();
                    loading.style.display = 'none';
                });
            }).catch(err => {
                console.error('PDF error:', err);
                showError('Ошибка PDF', `Не удалось обработать файл: ${err.message}`);
                loading.style.display = 'none';
            });
        };
        reader.readAsArrayBuffer(file);
    }

    function determineFormat(width, height) {
        for (const f of formats) {
            if (width >= f.minWidth && width <= f.maxWidth && height >= f.minHeight && height <= f.maxHeight) {
                return f.name;
            }
        }
        for (const f of formats) {
            if (height >= f.minWidth && height <= f.maxWidth && width >= f.minHeight && width <= f.maxHeight) {
                return f.name;
            }
        }
        return "Другой";
    }

    function calculatePageCost(format, width, height, a4Pages, a3Pages) {
        if (format === 'A4') {
            return getA4Price(a4Pages);
        } else if (format === 'A3') {
            return getA3Price(a3Pages);
        } else {
            const areaCm2 = (width / 72) * (height / 72) * 6.4516;
            return (areaCm2 * settings.pricePerSqM) / 10000;
        }
    }

    function getA4Price(count) {
        if (count <= 10) return settings.a4Prices['1_10'];
        if (count <= 50) return settings.a4Prices['11_50'];
        if (count <= 100) return settings.a4Prices['51_100'];
        return settings.a4Prices['101_500'];
    }

    function getA3Price(count) {
        if (count <= 10) return settings.a3Prices['1_10'];
        if (count <= 50) return settings.a3Prices['11_50'];
        if (count <= 100) return settings.a3Prices['51_100'];
        return settings.a3Prices['101_500'];
    }

    // UI update functions
    function updateFileDisplay(fileId, cost) {
        const el = document.querySelector(`.file-item[data-file-id="${fileId}"] .file-cost`);
        if (el) el.textContent = `${cost.toFixed(2)} руб.`;
    }

    function updateTotalCost() {
        const total = Array.from(filesData.values()).reduce((sum, f) => sum + f.cost, 0);
        totalCostValue.textContent = total.toFixed(2);
    }

    function updateStatistics() {
        let files = 0, pages = 0, a4 = 0, a3 = 0;
        formatStatistics = {};

        for (const data of filesData.values()) {
            files++;
            pages += data.pages;
            a4 += data.a4Pages;
            a3 += data.a3Pages;
            for (const [fmt, cnt] of Object.entries(data.formatCounts)) {
                formatStatistics[fmt] = (formatStatistics[fmt] || 0) + cnt;
            }
        }

        totalFilesCount.textContent = files;
        totalPagesCount.textContent = pages;
        totalA4Pages.textContent = a4;
        totalA3Pages.textContent = a3;
        updateFormatList();
        statsSection.classList.remove('hidden');
    }

    function updateFormatList() {
        formatList.innerHTML = '';
        const sorted = Object.entries(formatStatistics).sort(([a], [b]) => {
            const ia = formatOrder.indexOf(a), ib = formatOrder.indexOf(b);
            if (ia === -1) return 1;
            if (ib === -1) return -1;
            return ia - ib;
        });
        sorted.forEach(([fmt, cnt]) => {
            const item = document.createElement('div');
            item.className = 'format-item';
            item.innerHTML = `<div class="format-name">${fmt}</div><div class="format-count">${cnt} стр.</div>`;
            formatList.appendChild(item);
        });
    }

    function clearAllFiles() {
        filesData.clear();
        fileList.innerHTML = '';
        [fileList, filesTotal, clearAllBtn, statsSection].forEach(el => el.classList.add('hidden'));
        updateTotalCost();
    }

    function recalculateAllFiles() {
        if (filesData.size === 0) return;
        loading.style.display = 'block';
        // Очищаем текущие данные, но сохраняем файлы
        filesData.forEach((data, id) => {
            filesData.set(id, {
                file: data.file,
                cost: 0,
                pages: 0,
                a4Pages: 0,
                a3Pages: 0,
                otherPages: 0,
                formatCounts: {}
            });
        });
        filesData.forEach(data => calculatePdfCost(data.file));
    }

    function showError(title, details) {
        errorSection.classList.remove('hidden');
        document.getElementById('errorTitle').textContent = title;
        document.getElementById('errorDetails').textContent = details;
    }

    initEventHandlers();
}