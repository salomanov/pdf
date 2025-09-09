// Устанавливаем путь к worker'у для PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

// Форматы из XML
const formats = [
    { name: "A4", minWidth: 566.929, maxWidth: 623.622, minHeight: 813.543, maxHeight: 870.236, media: "sheet" },
    { name: "A3", minWidth: 813.543, maxWidth: 870.236, minHeight: 1162.205, maxHeight: 1218.898, media: "sheet" },
    { name: "A2", minWidth: 1162.205, maxWidth: 1218.898, minHeight: 1655.433, maxHeight: 1712.126, media: "roll" },
    { name: "A1", minWidth: 1655.433, maxWidth: 1712.126, minHeight: 2355.591, maxHeight: 2412.283, media: "roll" },
    { name: "A0", minWidth: 2355.591, maxWidth: 2412.283, minHeight: 3342.047, maxHeight: 3398.74, media: "roll" },
    { name: "A4x3", minWidth: 813.543, maxWidth: 870.236, minHeight: 1757.48, maxHeight: 1814.173, media: "roll" },
    { name: "A4x4", minWidth: 813.543, maxWidth: 870.236, minHeight: 2355.591, maxHeight: 2412.283, media: "roll" },
    { name: "A4x5", minWidth: 813.543, maxWidth: 870.236, minHeight: 2950.866, maxHeight: 3007.559, media: "roll" },
    { name: "A4x6", minWidth: 813.543, maxWidth: 870.236, minHeight: 3546.142, maxHeight: 3602.835, media: "roll" },
    { name: "A4x7", minWidth: 813.543, maxWidth: 870.236, minHeight: 4141.417, maxHeight: 4198.11, media: "roll" },
    { name: "A4x8", minWidth: 813.543, maxWidth: 870.236, minHeight: 4739.528, maxHeight: 4796.22, media: "roll" },
    { name: "A4x9", minWidth: 813.543, maxWidth: 870.236, minHeight: 5334.803, maxHeight: 5391.496, media: "roll" },
    { name: "A3x3", minWidth: 1162.205, maxWidth: 1218.898, minHeight: 2497.323, maxHeight: 2554.016, media: "roll" },
    { name: "A3x4", minWidth: 1162.205, maxWidth: 1218.898, minHeight: 3342.047, maxHeight: 3398.74, media: "roll" },
    { name: "A3x5", minWidth: 1162.205, maxWidth: 1218.898, minHeight: 4183.937, maxHeight: 4240.63, media: "roll" },
    { name: "A3x6", minWidth: 1162.205, maxWidth: 1218.898, minHeight: 5025.827, maxHeight: 5082.52, media: "roll" },
    { name: "A3x7", minWidth: 1162.205, maxWidth: 1218.898, minHeight: 5867.717, maxHeight: 5924.409, media: "roll" },
    { name: "A2x3", minWidth: 1655.433, maxWidth: 1712.126, minHeight: 3546.142, maxHeight: 3602.835, media: "roll" },
    { name: "A2x4", minWidth: 1655.433, maxWidth: 1712.126, minHeight: 4739.528, maxHeight: 4796.22, media: "roll" },
    { name: "A2x5", minWidth: 1655.433, maxWidth: 1712.126, minHeight: 5930.079, maxHeight: 5986.772, media: "roll" },
    { name: "A2x6", minWidth: 1655.433, maxWidth: 1712.126, minHeight: 7114.961, maxHeight: 7171.654, media: "roll" },
    { name: "A1x3", minWidth: 2355.591, maxWidth: 2412.283, minHeight: 5025.827, maxHeight: 5082.52, media: "roll" },
    { name: "A1x4", minWidth: 2355.591, maxWidth: 2412.283, minHeight: 6712.441, maxHeight: 6769.134, media: "roll" },
    { name: "A1x5", minWidth: 2355.591, maxWidth: 2412.283, minHeight: 8399.055, maxHeight: 8455.748, media: "roll" },
    { name: "A1x6", minWidth: 2355.591, maxWidth: 2412.283, minHeight: 10085.669, maxHeight: 10142.362, media: "roll" },
    { name: "A0x2", minWidth: 3342.047, maxWidth: 3398.74, minHeight: 4739.528, maxHeight: 4796.22, media: "roll" },
    { name: "A0x3", minWidth: 3342.047, maxWidth: 3398.74, minHeight: 7123.465, maxHeight: 7180.157, media: "roll" },
    { name: "A0x4", minWidth: 3342.047, maxWidth: 3398.74, minHeight: 9496.063, maxHeight: 9552.756, media: "roll" },
    { name: "A0x5", minWidth: 3342.047, maxWidth: 3398.74, minHeight: 11877.165, maxHeight: 11933.858, media: "roll" },
    { name: "A0x6", minWidth: 3342.047, maxWidth: 3398.74, minHeight: 14258.268, maxHeight: 14314.961, media: "roll" }
];

// Настройки по умолчанию
let settings = {
    pricePerSqM: 300, // Для других форматов
    a4Prices: {
        '1_10': 10,
        '11_50': 8,
        '51_100': 6,
        '101_500': 5
    },
    a3Prices: {
        '1_10': 20,
        '11_50': 16,
        '51_100': 12,
        '101_500': 10
    }
};

// Данные о загруженных файлах
let filesData = new Map();
let currentFileId = null;
let formatStatistics = {};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    const dropArea = document.getElementById('dropArea');
    const browseBtn = document.getElementById('browseBtn');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const resultsSection = document.getElementById('resultsSection');
    const filesTabs = document.getElementById('filesTabs');
    const currentFileName = document.getElementById('currentFileName');
    const pagesList = document.getElementById('pagesList');
    const totalCost = document.getElementById('totalCost');
    const grandTotalValue = document.getElementById('grandTotalValue');
    const totalFilesCount = document.getElementById('totalFilesCount');
    const totalPagesCount = document.getElementById('totalPagesCount');
    const totalA4Pages = document.getElementById('totalA4Pages');
    const totalA3Pages = document.getElementById('totalA3Pages');
    const formatStats = document.getElementById('formatStats');
    const loading = document.getElementById('loading');
    const totalPagesEl = document.getElementById('totalPages');
    const a4PagesEl = document.getElementById('a4Pages');
    const a3PagesEl = document.getElementById('a3Pages');
    const otherPagesEl = document.getElementById('otherPages');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const saveSettingsBtn = document.getElementById('saveSettings');
    const pricePerSqMInput = document.getElementById('pricePerSqM');
    const a4_1_10Input = document.getElementById('a4_1_10');
    const a4_11_50Input = document.getElementById('a4_11_50');
    const a4_51_100Input = document.getElementById('a4_51_100');
    const a4_101_500Input = document.getElementById('a4_101_500');
    const a3_1_10Input = document.getElementById('a3_1_10');
    const a3_11_50Input = document.getElementById('a3_11_50');
    const a3_51_100Input = document.getElementById('a3_51_100');
    const a3_101_500Input = document.getElementById('a3_101_500');
    const currentSettingsEl = document.getElementById('currentSettings');
    
    // Загрузка сохраненных настроек
    loadSettings();
    
    // Обновление отображения текущих настроек
    updateCurrentSettingsDisplay();
    
    // Инициализация обработчиков событий
    initEventHandlers();
    
    function initEventHandlers() {
        // Обработчики для drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });
        
        dropArea.addEventListener('drop', handleDrop, false);
        
        browseBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', function() {
            handleFiles(this.files);
        });
        
        clearAllBtn.addEventListener('click', clearAllFiles);
        
        // Обработчики модального окна настроек
        settingsBtn.addEventListener('click', openSettingsModal);
        closeModal.addEventListener('click', closeSettingsModal);
        cancelBtn.addEventListener('click', closeSettingsModal);
        saveSettingsBtn.addEventListener('click', saveSettings);
    }
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        dropArea.style.background = '#e8f4fc';
        dropArea.style.borderColor = '#2980b9';
    }
    
    function unhighlight() {
        dropArea.style.background = '#f8f9fa';
        dropArea.style.borderColor = '#3498db';
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    function openSettingsModal() {
        // Заполняем поля текущими значениями настроек
        pricePerSqMInput.value = settings.pricePerSqM;
        a4_1_10Input.value = settings.a4Prices['1_10'];
        a4_11_50Input.value = settings.a4Prices['11_50'];
        a4_51_100Input.value = settings.a4Prices['51_100'];
        a4_101_500Input.value = settings.a4Prices['101_500'];
        a3_1_10Input.value = settings.a3Prices['1_10'];
        a3_11_50Input.value = settings.a3Prices['11_50'];
        a3_51_100Input.value = settings.a3Prices['51_100'];
        a3_101_500Input.value = settings.a3Prices['101_500'];
        
        settingsModal.classList.add('active');
    }
    
    function closeSettingsModal() {
        settingsModal.classList.remove('active');
    }
    
    function saveSettings() {
        settings.pricePerSqM = parseFloat(pricePerSqMInput.value) || 300;
        settings.a4Prices = {
            '1_10': parseFloat(a4_1_10Input.value) || 10,
            '11_50': parseFloat(a4_11_50Input.value) || 8,
            '51_100': parseFloat(a4_51_100Input.value) || 6,
            '101_500': parseFloat(a4_101_500Input.value) || 5
        };
        settings.a3Prices = {
            '1_10': parseFloat(a3_1_10Input.value) || 20,
            '11_50': parseFloat(a3_11_50Input.value) || 16,
            '51_100': parseFloat(a3_51_100Input.value) || 12,
            '101_500': parseFloat(a3_101_500Input.value) || 10
        };
        
        // Сохраняем настройки в localStorage
        localStorage.setItem('pdfCalculatorSettings', JSON.stringify(settings));
        
        // Обновляем отображение текущих настроек
        updateCurrentSettingsDisplay();
        
        // Пересчитываем все загруженные файлы
        recalculateAllFiles();
        
        closeSettingsModal();
    }
    
    function loadSettings() {
        const savedSettings = localStorage.getItem('pdfCalculatorSettings');
        if (savedSettings) {
            settings = JSON.parse(savedSettings);
        }
    }
    
    function updateCurrentSettingsDisplay() {
        currentSettingsEl.textContent = `Текущая цена: индивидуальная для А4/А3, ${settings.pricePerSqM / 100} руб. за 100 см² для других форматов`;
    }
    
    function handleFiles(files) {
        if (files.length > 0) {
            loading.style.display = 'block';
            
            Array.from(files).forEach(file => {
                if (file.type === 'application/pdf') {
                    addFileToList(file);
                    calculatePdfCost(file);
                }
            });
        }
    }
    
    function addFileToList(file) {
        const fileId = Date.now() + Math.random().toString(36).substr(2, 9);
        const fileSize = formatFileSize(file.size);
        
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.fileId = fileId;
        fileItem.innerHTML = `
            <div class="file-name" title="${file.name}">${file.name}</div>
            <div class="file-size">${fileSize}</div>
            <div class="file-cost">0 руб.</div>
            <button class="remove-file" data-file-id="${fileId}">&times;</button>
        `;
        
        fileList.appendChild(fileItem);
        fileList.classList.remove('hidden');
        clearAllBtn.classList.remove('hidden');
        
        // Обработчик удаления файла
        fileItem.querySelector('.remove-file').addEventListener('click', function() {
            const removeFileId = this.dataset.fileId;
            removeFile(removeFileId);
        });
        
        // Добавляем файл в карту данных
        filesData.set(fileId, {
            file: file,
            name: file.name,
            size: fileSize,
            processed: false,
            pages: [],
            total: 0,
            numPages: 0,
            formatStats: {},
            a4Count: 0,
            a3Count: 0,
            otherCount: 0
        });
    }
    
    function removeFile(fileId) {
        // Удаляем из данных
        filesData.delete(fileId);
        
        // Удаляем из списка файлов
        const fileElement = document.querySelector(`.file-item[data-file-id="${fileId}"]`);
        if (fileElement) {
            fileElement.remove();
        }
        
        // Удаляем вкладку
        const tabElement = document.querySelector(`.file-tab[data-file-id="${fileId}"]`);
        if (tabElement) {
            tabElement.remove();
        }
        
        // Если удалили текущий файл, переключаемся на другой
        if (currentFileId === fileId) {
            if (filesData.size > 0) {
                const firstFileId = Array.from(filesData.keys())[0];
                switchFileTab(firstFileId);
            } else {
                // Нет файлов - скрываем результаты
                resultsSection.classList.add('hidden');
                fileList.classList.add('hidden');
                clearAllBtn.classList.add('hidden');
            }
        }
        
        // Пересчитываем общую статистику
        calculateOverallStatistics();
    }
    
    function clearAllFiles() {
        filesData.clear();
        fileList.innerHTML = '';
        filesTabs.innerHTML = '';
        resultsSection.classList.add('hidden');
        fileList.classList.add('hidden');
        clearAllBtn.classList.add('hidden');
        formatStatistics = {};
        updateFormatStatistics();
        updateOverallStatistics(0, 0, 0, 0, 0);
    }
    
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' байт';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' КБ';
        else return (bytes / 1048576).toFixed(1) + ' МБ';
    }
    
    // Функция для определения формата страницы
    function detectFormat(widthPt, heightPt) {
        for (const format of formats) {
            const isWidthInRange = widthPt >= format.minWidth && widthPt <= format.maxWidth;
            const isHeightInRange = heightPt >= format.minHeight && heightPt <= format.maxHeight;
            
            if (isWidthInRange && isHeightInRange) {
                return format.name;
            }
            
            // Проверяем альбомную ориентацию
            const isWidthInRangeRotated = widthPt >= format.minHeight && widthPt <= format.maxHeight;
            const isHeightInRangeRotated = heightPt >= format.minWidth && heightPt <= format.maxWidth;
            
            if (isWidthInRangeRotated && isHeightInRangeRotated) {
                return format.name;
            }
        }
        
        // Если не нашли подходящий формат, определяем по размерам
        const widthMm = widthPt * 0.352777;
        const heightMm = heightPt * 0.352777;
        
        if (widthMm < 300 && heightMm < 300) return "Малый формат";
        if (widthMm < 600 && heightMm < 600) return "Средний формат";
        return "Большой формат";
    }
    
    // Функция для получения цены в зависимости от количества страниц
    function getPriceForFormat(format, totalPages) {
        if (format === 'A4') {
            if (totalPages <= 10) return settings.a4Prices['1_10'];
            if (totalPages <= 50) return settings.a4Prices['11_50'];
            if (totalPages <= 100) return settings.a4Prices['51_100'];
            return settings.a4Prices['101_500'];
        }
        
        if (format === 'A3') {
            if (totalPages <= 10) return settings.a3Prices['1_10'];
            if (totalPages <= 50) return settings.a3Prices['11_50'];
            if (totalPages <= 100) return settings.a3Prices['51_100'];
            return settings.a3Prices['101_500'];
        }
        
        // Для других форматов используем расчет по площади
        return null;
    }
    
    // Функция для расчета стоимости PDF
    async function calculatePdfCost(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            const numPages = pdf.numPages;
            
            const pages = [];
            let fileTotal = 0;
            const fileFormatStats = {};
            let a4Count = 0;
            let a3Count = 0;
            let otherCount = 0;
            
            // Сначала считаем количество страниц каждого формата
            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1.0 });
                
                // Определяем формат
                const formatName = detectFormat(viewport.width, viewport.height);
                
                if (formatName === 'A4') a4Count++;
                else if (formatName === 'A3') a3Count++;
                else otherCount++;
            }
            
            // Получаем цены для A4 и A3
            const a4Price = getPriceForFormat('A4', a4Count);
            const a3Price = getPriceForFormat('A3', a3Count);
            
            // Теперь рассчитываем стоимость для каждой страницы
            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1.0 });
                
                // Размеры в пунктах (points)
                const widthPt = viewport.width;
                const heightPt = viewport.height;
                
                // Конвертируем в миллиметры (1 пункт = 0.352777 мм)
                const widthMm = widthPt * 0.352777;
                const heightMm = heightPt * 0.352777;
                
                // Определяем формат
                const formatName = detectFormat(widthPt, heightPt);
                
                let cost = 0;
                
                // Рассчитываем стоимость в зависимости от формата
                if (formatName === 'A4') {
                    cost = a4Price;
                } else if (formatName === 'A3') {
                    cost = a3Price;
                } else {
                    // Для других форматов рассчитываем по площади
                    const areaSqM = (widthMm * heightMm) / 1000000;
                    cost = areaSqM * settings.pricePerSqM;
                }
                
                // Обновляем статистику по форматам
                if (!fileFormatStats[formatName]) {
                    fileFormatStats[formatName] = { count: 0, totalCost: 0 };
                }
                fileFormatStats[formatName].count++;
                fileFormatStats[formatName].totalCost += cost;
                
                pages.push({ 
                    number: i, 
                    width: Math.round(widthMm), 
                    height: Math.round(heightMm), 
                    cost,
                    format: formatName
                });
                
                fileTotal += cost;
            }
            
            // Находим fileId для этого файла
            let fileId;
            for (let [id, data] of filesData.entries()) {
                if (data.file === file) {
                    fileId = id;
                    break;
                }
            }
            
            if (fileId) {
                // Обновляем данные файла
                const fileData = filesData.get(fileId);
                fileData.pages = pages;
                fileData.total = fileTotal;
                fileData.processed = true;
                fileData.numPages = numPages;
                fileData.formatStats = fileFormatStats;
                fileData.a4Count = a4Count;
                fileData.a3Count = a3Count;
                fileData.otherCount = otherCount;
                
                // Обновляем статистику по форматам
                updateFormatStatistics();
                
                // Обновляем стоимость в списке файлов
                const fileElement = document.querySelector(`.file-item[data-file-id="${fileId}"] .file-cost`);
                if (fileElement) {
                    fileElement.textContent = `${fileTotal.toFixed(2)} руб.`;
                }
                
                // Добавляем вкладку
                addFileTab(fileId, fileData.name, numPages, fileTotal);
                
                // Если это первый файл, показываем его
                if (filesData.size === 1) {
                    switchFileTab(fileId);
                    resultsSection.classList.remove('hidden');
                }
                
                // Пересчитываем общую статистику
                calculateOverallStatistics();
            }
            
        } catch (error) {
            console.error('Ошибка при обработке PDF:', error);
            alert(`Ошибка при обработке файла ${file.name}. Убедитесь, что файл не поврежден.`);
        } finally {
            // Скрываем индикатор загрузки, если все файлы обработаны
            let allProcessed = true;
            for (let data of filesData.values()) {
                if (!data.processed) {
                    allProcessed = false;
                    break;
                }
            }
            
            if (allProcessed) {
                loading.style.display = 'none';
            }
        }
    }
    
    function addFileTab(fileId, fileName, numPages, total) {
        const tab = document.createElement('div');
        tab.className = 'file-tab';
        tab.dataset.fileId = fileId;
        tab.innerHTML = `
            ${fileName} <span class="page-count">(${numPages} стр. - ${total.toFixed(2)} руб.)</span>
        `;
        
        tab.addEventListener('click', () => {
            switchFileTab(fileId);
        });
        
        filesTabs.appendChild(tab);
        
        // Активируем вкладку, если она первая
        if (filesTabs.children.length === 1) {
            tab.classList.add('active');
        }
    }
    
    function switchFileTab(fileId) {
        // Убираем активный класс у всех вкладок
        document.querySelectorAll('.file-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Добавляем активный класс выбранной вкладке
        const activeTab = document.querySelector(`.file-tab[data-file-id="${fileId}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Показываем данные выбранного файла
        const fileData = filesData.get(fileId);
        if (fileData) {
            currentFileId = fileId;
            currentFileName.textContent = fileData.name;
            displayFileResults(fileData);
        }
    }
    
    function displayFileResults(fileData) {
        const { pages, numPages, total, a4Count, a3Count, otherCount } = fileData;
        
        // Очищаем предыдущие результаты
        pagesList.innerHTML = '';
        
        // Добавляем информацию о каждой странице
        pages.forEach(page => {
            const pageItem = document.createElement('div');
            pageItem.className = 'page-item';
            pageItem.innerHTML = `
                <div class="page-info">Страница №${page.number} (${page.width} × ${page.height} мм) - ${page.format}</div>
                <div class="page-cost">${page.cost} руб.</div>
            `;
            pagesList.appendChild(pageItem);
        });
        
        // Обновляем общую стоимость файла
        totalCost.textContent = `Стоимость файла: ${total.toFixed(2)} руб.`;
        
        // Обновляем сводную информацию по файлу
        totalPagesEl.textContent = numPages;
        a4PagesEl.textContent = a4Count;
        a3PagesEl.textContent = a3Count;
        otherPagesEl.textContent = otherCount;
    }
    
    function updateFormatStatistics() {
        // Сбрасываем статистику
        formatStatistics = {};
        
        // Собираем статистику по всем файлам
        for (const fileData of filesData.values()) {
            if (fileData.processed) {
                for (const [formatName, stats] of Object.entries(fileData.formatStats)) {
                    if (!formatStatistics[formatName]) {
                        formatStatistics[formatName] = {
                            count: 0,
                            totalCost: 0
                        };
                    }
                    formatStatistics[formatName].count += stats.count;
                    formatStatistics[formatName].totalCost += stats.totalCost;
                }
            }
        }
        
        // Обновляем отображение статистики
        displayFormatStatistics();
    }
    
    function displayFormatStatistics() {
        const formatStatsElement = document.getElementById('formatStats');
        formatStatsElement.innerHTML = '';
        
        // Сортируем форматы по количеству страниц (по убыванию)
        const sortedFormats = Object.entries(formatStatistics)
            .sort(([,a], [,b]) => b.count - a.count);
        
        if (sortedFormats.length === 0) {
            formatStatsElement.innerHTML = '<p class="no-stats">Нет данных о форматах</p>';
            return;
        }
        
        for (const [formatName, stats] of sortedFormats) {
            const formatItem = document.createElement('div');
            formatItem.className = 'format-stat-item';
            formatItem.innerHTML = `
                <div class="format-stat-header">
                    <span class="format-name">${formatName}</span>
                    <span class="format-count">${stats.count} стр.</span>
                </div>
                <div class="format-details">
                    <div class="format-detail">
                        <div class="format-detail-value">${stats.totalCost.toFixed(2)} руб.</div>
                        <div class="format-detail-label">общая стоимость</div>
                    </div>
                </div>
            `;
            
            formatStatsElement.appendChild(formatItem);
        }
    }
    
    function calculateOverallStatistics() {
        let grandTotal = 0;
        let totalPages = 0;
        let processedFiles = 0;
        let totalA4 = 0;
        let totalA3 = 0;
        
        for (let data of filesData.values()) {
            if (data.processed) {
                grandTotal += data.total;
                totalPages += data.numPages;
                totalA4 += data.a4Count;
                totalA3 += data.a3Count;
                processedFiles++;
            }
        }
        
        // Обновляем общую статистику
        updateOverallStatistics(grandTotal, processedFiles, totalPages, totalA4, totalA3);
    }
    
    function updateOverallStatistics(total, files, pages, a4, a3) {
        grandTotalValue.textContent = total.toFixed(2);
        totalFilesCount.textContent = files;
        totalPagesCount.textContent = pages;
        totalA4Pages.textContent = a4;
        totalA3Pages.textContent = a3;
    }
    
    function recalculateAllFiles() {
        if (filesData.size > 0) {
            loading.style.display = 'block';
            
            // Пересчитываем каждый файл
            const promises = [];
            for (let [fileId, fileData] of filesData.entries()) {
                if (fileData.processed) {
                    promises.push(recalculateFile(fileId, fileData.file));
                }
            }
            
            // Когда все пересчитаны, обновляем отображение
            Promise.all(promises).then(() => {
                loading.style.display = 'none';
                calculateOverallStatistics();
                if (currentFileId) {
                    const currentFileData = filesData.get(currentFileId);
                    if (currentFileData) {
                        displayFileResults(currentFileData);
                    }
                }
            });
        }
    }
    
    async function recalculateFile(fileId, file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            const numPages = pdf.numPages;
            
            const pages = [];
            let fileTotal = 0;
            const fileFormatStats = {};
            let a4Count = 0;
            let a3Count = 0;
            let otherCount = 0;
            
            // Сначала считаем количество страниц каждого формата
            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1.0 });
                
                // Определяем формат
                const formatName = detectFormat(viewport.width, viewport.height);
                
                if (formatName === 'A4') a4Count++;
                else if (formatName === 'A3') a3Count++;
                else otherCount++;
            }
            
            // Получаем цены для A4 и A3
            const a4Price = getPriceForFormat('A4', a4Count);
            const a3Price = getPriceForFormat('A3', a3Count);
            
            // Теперь рассчитываем стоимость для каждой страницы
            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1.0 });
                
                // Размеры в пунктах (points)
                const widthPt = viewport.width;
                const heightPt = viewport.height;
                
                // Конвертируем в миллиметры (1 пункт = 0.352777 мм)
                const widthMm = widthPt * 0.352777;
                const heightMm = heightPt * 0.352777;
                
                // Определяем формат
                const formatName = detectFormat(widthPt, heightPt);
                
                let cost = 0;
                
                // Рассчитываем стоимость в зависимости от формата
                if (formatName === 'A4') {
                    cost = a4Price;
                } else if (formatName === 'A3') {
                    cost = a3Price;
                } else {
                    // Для других форматов рассчитываем по площади
                    const areaSqM = (widthMm * heightMm) / 1000000;
                    cost = areaSqM * settings.pricePerSqM;
                }
                
                // Обновляем статистику по форматам
                if (!fileFormatStats[formatName]) {
                    fileFormatStats[formatName] = { count: 0, totalCost: 0 };
                }
                fileFormatStats[formatName].count++;
                fileFormatStats[formatName].totalCost += cost;
                
                pages.push({ 
                    number: i, 
                    width: Math.round(widthMm), 
                    height: Math.round(heightMm), 
                    cost,
                    format: formatName
                });
                
                fileTotal += cost;
            }
            
            // Обновляем данные файла
            const fileData = filesData.get(fileId);
            fileData.pages = pages;
            fileData.total = fileTotal;
            fileData.numPages = numPages;
            fileData.formatStats = fileFormatStats;
            fileData.a4Count = a4Count;
            fileData.a3Count = a3Count;
            fileData.otherCount = otherCount;
            
            // Обновляем статистику по форматам
            updateFormatStatistics();
            
            // Обновляем стоимость в списке файлов
            const fileElement = document.querySelector(`.file-item[data-file-id="${fileId}"] .file-cost`);
            if (fileElement) {
                fileElement.textContent = `${fileTotal.toFixed(2)} руб.`;
            }
            
            // Обновляем вкладку
            const tab = document.querySelector(`.file-tab[data-file-id="${fileId}"]`);
            if (tab) {
                tab.innerHTML = `${fileData.name} <span class="page-count">(${numPages} стр. - ${fileTotal.toFixed(2)} руб.)</span>`;
            }
            
        } catch (error) {
            console.error('Ошибка при пересчете файла:', error);
        }
    }
}