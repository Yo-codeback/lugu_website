// 圖片管理
let currentImageIndex = 1;
let totalImages = 0;
let images = [];

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    detectImages();
    loadImage(currentImageIndex);
    setupEventListeners();
    setupTabs(); // 設定分頁功能
    setupRecommendButton(); // 設定推薦按鈕
    fetchWeatherData(); // 載入天氣資料
    loadAttractions(); // 載入景點資料
});

// 偵測圖片數量
function detectImages() {
    let index = 1;
    const checkImage = () => {
        const img = new Image();
        img.onload = () => {
            images.push(index);
            index++;
            checkImage();
        };
        img.onerror = () => {
            totalImages = images.length;
            if (totalImages === 0) {
                console.warn('未找到圖片，請確認 image 資料夾中有 1.png');
                totalImages = 1; // 至少顯示一張
            }
            updateCounter();
        };
        img.src = `image/${index}.png`;
    };
    checkImage();
}

// 載入圖片
function loadImage(index) {
    if (index < 1) {
        currentImageIndex = totalImages;
    } else if (index > totalImages) {
        currentImageIndex = 1;
    } else {
        currentImageIndex = index;
    }
    
    const img = document.getElementById('currentImage');
    img.src = `image/${currentImageIndex}.png`;
    img.onerror = () => {
        console.error(`無法載入圖片: image/${currentImageIndex}.png`);
    };
    
    updateCounter();
}

// 更新計數器
function updateCounter() {
    const counter = document.getElementById('imageCounter');
    counter.textContent = `${currentImageIndex} / ${totalImages}`;
}

// 上一張
function prevImage() {
    loadImage(currentImageIndex - 1);
}

// 下一張
function nextImage() {
    loadImage(currentImageIndex + 1);
}

// 設定事件監聽器
function setupEventListeners() {
    // 按鈕點擊
    document.getElementById('prevBtn').addEventListener('click', prevImage);
    document.getElementById('nextBtn').addEventListener('click', nextImage);
    
    // 鍵盤控制
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevImage();
        } else if (e.key === 'ArrowRight') {
            nextImage();
        }
    });
    
    // 滑鼠拖曳
    let isDragging = false;
    let startX = 0;
    let currentX = 0;
    let threshold = 50; // 拖曳閾值
    
    const imageWrapper = document.getElementById('imageWrapper');
    
    imageWrapper.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        imageWrapper.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        currentX = e.clientX;
    });
    
    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        imageWrapper.style.cursor = 'grab';
        
        const diff = startX - currentX;
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                nextImage();
            } else {
                prevImage();
            }
        }
    });
    
    // 觸控支援
    let touchStartX = 0;
    let touchEndX = 0;
    
    imageWrapper.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    imageWrapper.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                nextImage();
            } else {
                prevImage();
            }
        }
    }
    
    // 匯出按鈕
    document.getElementById('exportBtn').addEventListener('click', exportImage);
    
    // 分享按鈕
    document.getElementById('shareBtn').addEventListener('click', shareContent);
}

// 設定分頁功能
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // 移除所有活動狀態
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // 添加活動狀態
            btn.classList.add('active');
            const targetContent = document.getElementById(targetTab + 'Tab');
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            // 如果是天氣預報分頁，載入預報資料
            if (targetTab === 'forecast') {
                loadWeatherForecast();
            }
        });
    });
}

// 載入天氣預報
function loadWeatherForecast() {
    const forecastContainer = document.getElementById('forecastContainer');
    if (!forecastContainer) return;
    
    // 檢查是否已經載入過
    if (forecastContainer.dataset.loaded === 'true') {
        return;
    }
    
    forecastContainer.innerHTML = '<div class="loading">載入中...</div>';
    
    // 從現有的天氣資料中提取預報（如果有的話）
    if (typeof weatherDataCache !== 'undefined' && weatherDataCache) {
        displayForecast(weatherDataCache);
        forecastContainer.dataset.loaded = 'true';
        return;
    }
    
    // 否則重新獲取
    fetchWeatherData().then(() => {
        if (typeof weatherDataCache !== 'undefined' && weatherDataCache) {
            displayForecast(weatherDataCache);
            forecastContainer.dataset.loaded = 'true';
        }
    });
}

// 顯示天氣預報
let weatherDataCache = null;

function displayForecast(data) {
    const forecastContainer = document.getElementById('forecastContainer');
    if (!forecastContainer || !data) {
        forecastContainer.innerHTML = '<div class="loading">無法載入預報資料</div>';
        return;
    }
    
    // 解析預報資料
    let forecastItems = [];
    
    if (data.result && data.result.records && data.result.records.Locations) {
        const locations = data.result.records.Locations;
        const nantou = locations.find(loc => loc.LocationsName === '南投縣');
        if (nantou && nantou.Location) {
            const lugu = nantou.Location.find(loc => loc.LocationName === '鹿谷鄉');
            if (lugu && lugu.WeatherElement) {
                weatherDataCache = lugu;
                // 從 WeatherElement 中提取預報資料
                const tempElement = lugu.WeatherElement.find(e => e.ElementName === '平均溫度');
                const weatherElement = lugu.WeatherElement.find(e => e.ElementName === '天氣現象');
                const humidityElement = lugu.WeatherElement.find(e => e.ElementName === '平均相對濕度');
                
                if (tempElement && tempElement.Time) {
                    tempElement.Time.forEach((time, index) => {
                        const temp = time.ElementValue?.[0]?.Temperature || 'N/A';
                        const weather = weatherElement?.Time?.[index]?.ElementValue?.[0]?.Weather || 'N/A';
                        const humidity = humidityElement?.Time?.[index]?.ElementValue?.[0]?.RelativeHumidity || 'N/A';
                        
                        forecastItems.push({
                            startTime: time.StartTime,
                            endTime: time.EndTime,
                            temperature: temp,
                            weather: weather,
                            humidity: humidity
                        });
                    });
                }
            }
        }
    }
    
    if (forecastItems.length === 0) {
        forecastContainer.innerHTML = '<div class="loading">目前無法取得預報資料</div>';
        return;
    }
    
    // 顯示預報卡片（最多顯示 14 個，即 7 天）
    const displayItems = forecastItems.slice(0, 14);
    forecastContainer.innerHTML = displayItems.map((item, index) => {
        const startDate = new Date(item.startTime);
        const endDate = new Date(item.endTime);
        const dateStr = startDate.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
        const timeStr = `${startDate.getHours()}:00 - ${endDate.getHours()}:00`;
        
        return `
            <div class="forecast-card">
                <div class="forecast-date">${dateStr}</div>
                <div class="forecast-time">${timeStr}</div>
                <div class="forecast-weather">${item.weather}</div>
                <div class="forecast-temp">${item.temperature}°C</div>
                <div class="forecast-details">
                    <div>濕度：${item.humidity}%</div>
                </div>
            </div>
        `;
    }).join('');
}

// 載入景點資料
async function loadAttractions() {
    const attractionsContainer = document.getElementById('attractionsContainer');
    if (!attractionsContainer) return;
    
    try {
        const response = await fetch('attractions.json');
        if (!response.ok) {
            throw new Error('無法載入景點資料');
        }
        
        const attractions = await response.json();
        displayAttractions(attractions);
    } catch (error) {
        console.error('載入景點失敗:', error);
        attractionsContainer.innerHTML = '<div class="loading">無法載入景點資料</div>';
    }
}

// 顯示景點
function displayAttractions(attractions) {
    const attractionsContainer = document.getElementById('attractionsContainer');
    if (!attractionsContainer) return;
    
    if (!attractions || attractions.length === 0) {
        attractionsContainer.innerHTML = '<div class="loading">目前沒有景點資料</div>';
        return;
    }
    
    attractionsContainer.innerHTML = attractions.map(attraction => {
        const features = (attraction.features || []).map(feature => 
            `<span class="feature-tag">${feature}</span>`
        ).join('');
        
        // 圖片區塊（如果沒有圖片或圖片載入失敗就隱藏）
        const imageHtml = attraction.image ? `
            <img src="${attraction.image}" alt="${attraction.name}" class="attraction-image" 
                 onerror="this.style.display='none'; this.parentElement.style.display='none';">
        ` : '';
        
        return `
            <div class="attraction-card">
                ${imageHtml ? `<div class="attraction-image-wrapper">${imageHtml}</div>` : ''}
                <div class="attraction-content">
                    <h3 class="attraction-name">${attraction.name}</h3>
                    <p class="attraction-description">${attraction.description}</p>
                    <div class="attraction-details">
                        ${attraction.address ? `<div><strong>地址：</strong>${attraction.address}</div>` : ''}
                        ${attraction.phone ? `<div><strong>電話：</strong>${attraction.phone}</div>` : ''}
                        ${attraction.hours ? `<div><strong>營業時間：</strong>${attraction.hours}</div>` : ''}
                        ${features ? `<div class="attraction-features">${features}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 設定推薦按鈕
function setupRecommendButton() {
    const recommendBtn = document.getElementById('recommendBtn');
    if (recommendBtn) {
        recommendBtn.addEventListener('click', recommendAttraction);
    }
}

// 推薦景點功能
function recommendAttraction() {
    const email = 'makerbackup0821@gmail.com';
    const subject = encodeURIComponent('推薦鹿谷景點');
    
    // 預設郵件內容格式
    const body = encodeURIComponent(`親愛的網站管理員：

我想推薦以下鹿谷景點：

【景點名稱】：
【景點地址】：
【推薦理由】：
【其他資訊】：

感謝您的網站提供這麼好的服務！

此致
敬禮`);

    // 建立 mailto 連結
    const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;
    
    // 開啟郵件程式
    window.location.href = mailtoLink;
}

// 分享功能
async function shareContent() {
    const shareBtn = document.getElementById('shareBtn');
    const originalText = shareBtn.textContent;
    
    try {
        // 獲取當前天氣資訊
        const temperature = document.getElementById('temperature')?.textContent || 'N/A';
        const humidity = document.getElementById('humidity')?.textContent || 'N/A';
        const weatherCondition = document.getElementById('weatherCondition')?.textContent || 'N/A';
        const windSpeed = document.getElementById('windSpeed')?.textContent || 'N/A';
        
        const shareText = `南投鹿谷天氣資訊\n溫度：${temperature}\n濕度：${humidity}\n天氣狀況：${weatherCondition}\n風速：${windSpeed}\n\n查看完整資訊：${window.location.href}`;
        
        // 檢查是否支援 Web Share API
        if (navigator.share) {
            await navigator.share({
                title: '南投鹿谷天氣資訊',
                text: shareText,
                url: window.location.href
            });
        } else {
            // 降級方案：複製到剪貼簿
            await navigator.clipboard.writeText(shareText);
            shareBtn.textContent = '已複製！';
            setTimeout(() => {
                shareBtn.textContent = originalText;
            }, 2000);
        }
    } catch (error) {
        console.error('分享失敗:', error);
        
        // 降級方案：複製到剪貼簿
        const temperature = document.getElementById('temperature')?.textContent || 'N/A';
        const humidity = document.getElementById('humidity')?.textContent || 'N/A';
        const weatherCondition = document.getElementById('weatherCondition')?.textContent || 'N/A';
        const windSpeed = document.getElementById('windSpeed')?.textContent || 'N/A';
        
        const shareText = `南投鹿谷天氣資訊\n溫度：${temperature}\n濕度：${humidity}\n天氣狀況：${weatherCondition}\n風速：${windSpeed}\n\n查看完整資訊：${window.location.href}`;
        
        try {
            await navigator.clipboard.writeText(shareText);
            shareBtn.textContent = '已複製！';
            setTimeout(() => {
                shareBtn.textContent = originalText;
            }, 2000);
        } catch (clipboardError) {
            alert('無法分享，請手動複製以下內容：\n\n' + shareText);
        }
    }
}

// 獲取天氣資料
async function fetchWeatherData() {
    try {
        // 檢查 API URL 是否定義
        if (typeof WEATHER_API_URL === 'undefined' || !WEATHER_API_URL || WEATHER_API_URL.includes('YOUR_API_KEY')) {
            console.warn('天氣 API URL 未設定，請在 index.html 中設定 WEATHER_API_URL');
            showWeatherNA();
            return;
        }
        
        const response = await fetch(WEATHER_API_URL);
        if (!response.ok) {
            throw new Error('無法獲取天氣資料');
        }
        
        const data = await response.json();
        
        // 調試：查看 API 回傳的資料結構
        console.log('API 回傳完整資料:', data);
        console.log('result 結構:', data.result);
        console.log('result.records 結構:', data.result?.records);
        console.log('records 結構:', data.records);
        console.log('records.Locations 結構:', data.records?.Locations);
        
        // 解析資料（F-D0047-023 為鄉鎮市區預報資料）
        let location = null;
        let weatherData = null;
        
        // 結構0: records.Locations[] (實際 API 格式)
        // Locations 陣列包含縣市，每個縣市有 Location 陣列包含各鄉鎮
        if (data.records && data.records.Locations && Array.isArray(data.records.Locations)) {
            console.log('找到 records.Locations 格式，數量:', data.records.Locations.length);
            
            // 先尋找南投縣
            let nantouLocation = data.records.Locations.find(loc => 
                loc.LocationsName === '南投縣' || 
                (loc.LocationsName && loc.LocationsName.includes('南投'))
            );
            
            if (nantouLocation) {
                console.log('找到南投縣，LocationsName:', nantouLocation.LocationsName);
                console.log('Location 陣列數量:', nantouLocation.Location?.length);
                
                // 在南投縣的 Location 陣列中尋找鹿谷鄉
                if (nantouLocation.Location && Array.isArray(nantouLocation.Location)) {
                    location = nantouLocation.Location.find(loc => 
                        loc.LocationName === '鹿谷鄉' || 
                        (loc.LocationName && loc.LocationName.includes('鹿谷'))
                    );
                    
                    if (location) {
                        console.log('找到鹿谷鄉資料:', location.LocationName);
                        if (location.WeatherElement && Array.isArray(location.WeatherElement)) {
                            console.log('找到 WeatherElement，數量:', location.WeatherElement.length);
                            weatherDataCache = location; // 快取資料供預報使用
                            updateWeatherInfo(location.WeatherElement);
                            
                            // 如果預報分頁是活動的，更新預報
                            const forecastTab = document.getElementById('forecastTab');
                            if (forecastTab && forecastTab.classList.contains('active')) {
                                displayForecast({ result: { records: { Locations: data.records.Locations } } });
                            }
                            return;
                        } else {
                            console.warn('WeatherElement 不存在或不是陣列:', location.WeatherElement);
                        }
                    } else {
                        console.warn('未找到鹿谷鄉，所有 Location 名稱:', nantouLocation.Location.map(l => l.LocationName));
                    }
                } else {
                    console.warn('Location 不存在或不是陣列:', nantouLocation.Location);
                }
            } else {
                console.warn('未找到南投縣，所有 LocationsName:', data.records.Locations.map(l => l.LocationsName));
                // 如果找不到南投縣，嘗試在所有 Locations 的 Location 陣列中搜尋
                for (const locGroup of data.records.Locations) {
                    if (locGroup.Location && Array.isArray(locGroup.Location)) {
                        location = locGroup.Location.find(loc => 
                            loc.LocationName === '鹿谷鄉' || 
                            (loc.LocationName && loc.LocationName.includes('鹿谷'))
                        );
                        if (location) {
                            console.log('在其他縣市找到鹿谷鄉:', locGroup.LocationsName, location.LocationName);
                            if (location.WeatherElement && Array.isArray(location.WeatherElement)) {
                                console.log('找到 WeatherElement，數量:', location.WeatherElement.length);
                                updateWeatherInfo(location.WeatherElement);
                                return;
                            }
                        }
                    }
                }
            }
        }
        
        // 結構1: result.records[] (可能是物件或陣列格式)
        if (data.result && data.result.records) {
            console.log('找到 result.records 格式');
            console.log('result.records 類型:', typeof data.result.records, Array.isArray(data.result.records));
            console.log('result.records 內容:', data.result.records);
            
            // 檢查是否是包含 LocationName 和 WeatherElement 的物件（單一物件格式）
            if (data.result.records.LocationName && data.result.records.WeatherElement) {
                console.log('找到單一 location 物件格式');
                console.log('LocationName:', data.result.records.LocationName);
                console.log('WeatherElement 數量:', data.result.records.WeatherElement?.length);
                const location = data.result.records;
                if (location.LocationName === '鹿谷鄉' || location.LocationName?.includes('鹿谷')) {
                    console.log('找到鹿谷鄉資料，開始解析 WeatherElement');
                    if (location.WeatherElement && Array.isArray(location.WeatherElement)) {
                        console.log('調用 updateWeatherInfo，WeatherElement 數量:', location.WeatherElement.length);
                        weatherDataCache = location; // 快取資料供預報使用
                updateWeatherInfo(location.WeatherElement);
                        
                        // 如果預報分頁是活動的，更新預報
                        const forecastTab = document.getElementById('forecastTab');
                        if (forecastTab && forecastTab.classList.contains('active')) {
                            displayForecast({ result: { records: { Locations: [data.result.records] } } });
                        }
                        return;
                    } else {
                        console.warn('WeatherElement 不是陣列或不存在:', location.WeatherElement);
                    }
                } else {
                    console.log('LocationName 不匹配:', location.LocationName);
                }
            }
            
            // 檢查是否是陣列格式
            const records = Array.isArray(data.result.records) ? data.result.records : [data.result.records];
            console.log('records 數量:', records.length);
            
            // 尋找包含 LocationName 和 WeatherElement 的物件
            const luguLocation = records.find(record => 
                record.LocationName === '鹿谷鄉' || 
                (record.LocationName && record.LocationName.includes('鹿谷'))
            );
            
            if (luguLocation && luguLocation.WeatherElement && Array.isArray(luguLocation.WeatherElement)) {
                console.log('在 records 陣列中找到鹿谷鄉，開始解析 WeatherElement');
                console.log('WeatherElement 數量:', luguLocation.WeatherElement.length);
                updateWeatherInfo(luguLocation.WeatherElement);
                return;
            } else {
                console.warn('未找到鹿谷鄉或 WeatherElement 格式不正確');
                console.log('luguLocation:', luguLocation);
                if (luguLocation) {
                    console.log('luguLocation.WeatherElement:', luguLocation.WeatherElement);
                }
            }
            
            // 表格格式處理（舊邏輯保留作為備用）
            const luguRecords = records.filter(record => 
                record.LocationName === '鹿谷鄉' || 
                (record.LocationName && record.LocationName.includes('鹿谷'))
            );
            
            console.log('找到鹿谷鄉的記錄數量:', luguRecords.length);
            
            if (luguRecords.length > 0) {
                // 從記錄中提取天氣資料
                weatherData = {
                    temperature: null,
                    humidity: null,
                    weatherCondition: null,
                    windSpeed: null
                };
                
                // 處理每筆記錄（按 ElementName 分類）
                luguRecords.forEach(record => {
                    console.log('處理記錄:', record.ElementName, record);
                    
                    if (record.ElementName) {
                        const elementName = record.ElementName.toLowerCase();
                        
                        // 根據 ElementName 分類資料
                        // 溫度相關
                        if (elementName.includes('溫度') || elementName.includes('temperature') || elementName === 't') {
                            const temp = record.Temperature || record.MaxTemperature || record.Value || record.Parameter;
                            if (temp && !weatherData.temperature) {
                                weatherData.temperature = temp + '°C';
                            }
                        }
                        // 濕度相關
                        else if (elementName.includes('濕度') || elementName.includes('humidity') || elementName === 'rh') {
                            const hum = record.RH || record.RelativeHumidity || record.DewPoint || record.Value || record.Parameter;
                            if (hum && !weatherData.humidity) {
                                weatherData.humidity = hum + '%';
                            }
                        }
                        // 天氣現象相關
                        else if (elementName.includes('天氣') || elementName.includes('weather') || elementName.includes('wx') || elementName.includes('現象')) {
                            const weather = record.Parameter || record.ParameterName || record.ParameterValue || record.Value || record.Weather;
                            if (weather && !weatherData.weatherCondition) {
                                weatherData.weatherCondition = weather;
                            }
                        }
                        // 風速相關
                        else if (elementName.includes('風速') || elementName.includes('windspeed') || elementName.includes('ws') || elementName.includes('wind')) {
                            const wind = record.WS || record.WindSpeed || record.Value || record.Parameter;
                            if (wind && !weatherData.windSpeed) {
                                weatherData.windSpeed = wind + ' km/h';
                            }
                        }
                        
                        // 如果記錄直接包含溫度欄位（不分 ElementName）
                        if (record.Temperature && !weatherData.temperature) {
                            weatherData.temperature = record.Temperature + '°C';
                        }
                        if (record.MaxTemperature && !weatherData.temperature) {
                            weatherData.temperature = record.MaxTemperature + '°C';
                        }
                    }
                });
                
                // 如果成功提取資料，更新顯示
                if (weatherData.temperature || weatherData.humidity || weatherData.weatherCondition || weatherData.windSpeed) {
                    console.log('提取到的天氣資料:', weatherData);
                    updateWeatherInfoFromRecords(weatherData);
                    return;
                }
            }
        }
        
        // 嘗試多種可能的資料結構
        if (data.records) {
            // 結構1: records.locations[] (陣列格式)
            if (data.records.locations && Array.isArray(data.records.locations) && data.records.locations.length > 0) {
                console.log('找到 locations 陣列，數量:', data.records.locations.length);
                
                // 先尋找南投縣
                let nantouGroup = data.records.locations.find(loc => 
                    loc.locationsName === '南投縣' || 
                    loc.locationName === '南投縣' ||
                    (loc.locationsName && loc.locationsName.includes('南投')) ||
                    (loc.locationName && loc.locationName.includes('南投'))
                );
                
                if (!nantouGroup) {
                    // 如果找不到南投縣，搜尋所有 locations
                    console.log('未找到南投縣，搜尋所有 locations');
                    for (const group of data.records.locations) {
                        console.log('檢查 location group:', group.locationsName || group.locationName);
                        if (group.location && Array.isArray(group.location)) {
                            const found = group.location.find(loc => 
                                loc.locationName === '鹿谷鄉' || 
                                (loc.locationName && loc.locationName.includes('鹿谷'))
                            );
                            if (found) {
                                location = found;
                                console.log('找到鹿谷鄉:', location);
                                break;
                            }
                        }
            }
        } else {
                    console.log('找到南投縣群組:', nantouGroup);
                    // 在南投縣下尋找鹿谷鄉
                    if (nantouGroup.location && Array.isArray(nantouGroup.location)) {
                        location = nantouGroup.location.find(loc => 
                            loc.locationName === '鹿谷鄉' || 
                            (loc.locationName && loc.locationName.includes('鹿谷'))
                        );
                        console.log('在南投縣下找到鹿谷鄉:', location);
                    }
                }
                
                if (location) {
                    const weatherElements = location.weatherElement || location.WeatherElement;
                    if (weatherElements) {
                        console.log('找到天氣元素，開始更新資訊');
                        updateWeatherInfo(weatherElements);
                        return;
                    }
                }
            }
            
            // 結構2: records.location[] (觀測資料格式)
            if (data.records.location && Array.isArray(data.records.location) && data.records.location.length > 0) {
                console.log('找到 location 陣列（觀測資料格式）');
                location = data.records.location.find(loc => 
                    loc.LocationName === '鹿谷鄉' || 
                    loc.locationName === '鹿谷鄉' ||
                    (loc.LocationName && loc.LocationName.includes('鹿谷')) ||
                    (loc.locationName && loc.locationName.includes('鹿谷'))
                );
                
                if (location) {
                    const weatherElements = location.WeatherElement || location.weatherElement;
                    if (weatherElements) {
                        console.log('找到天氣元素（觀測資料），開始更新資訊');
                        updateWeatherInfo(weatherElements);
                        return;
                    }
                }
            }
            
            // 結構3: records.locations (單一物件格式，可能包含 location 陣列)
            if (data.records.locations && !Array.isArray(data.records.locations) && data.records.locations.location) {
                console.log('找到 locations 物件格式');
                const locations = Array.isArray(data.records.locations.location) 
                    ? data.records.locations.location 
                    : [data.records.locations.location];
                    
                location = locations.find(loc => 
                    loc.locationName === '鹿谷鄉' || 
                    (loc.locationName && loc.locationName.includes('鹿谷'))
                );
                
                if (location) {
                    const weatherElements = location.weatherElement || location.WeatherElement;
                    if (weatherElements) {
                        console.log('找到天氣元素（物件格式），開始更新資訊');
                        updateWeatherInfo(weatherElements);
                        return;
                    }
                }
            }
        }
        
        // 如果所有解析都失敗
        console.warn('無法解析 API 資料結構，顯示的資料結構：', JSON.stringify(data, null, 2).substring(0, 1000));
            showWeatherNA();
    } catch (error) {
        console.error('獲取天氣資料失敗:', error);
        // API 失敗時顯示 N/A
        showWeatherNA();
    }
}

// 顯示天氣資料為 N/A
function showWeatherNA() {
    document.getElementById('temperature').textContent = 'N/A';
    document.getElementById('humidity').textContent = 'N/A';
    document.getElementById('weatherCondition').textContent = 'N/A';
    document.getElementById('windSpeed').textContent = 'N/A';
}

// 從表格格式記錄更新天氣資訊
function updateWeatherInfoFromRecords(weatherData) {
    document.getElementById('temperature').textContent = weatherData.temperature || 'N/A';
    document.getElementById('humidity').textContent = weatherData.humidity || 'N/A';
    document.getElementById('weatherCondition').textContent = weatherData.weatherCondition || 'N/A';
    document.getElementById('windSpeed').textContent = weatherData.windSpeed || 'N/A';
}

// 更新天氣資訊
function updateWeatherInfo(weatherElements) {
    let temperature = 'N/A';
    let humidity = 'N/A';
    let weatherCondition = 'N/A';
    let windSpeed = 'N/A';
    
    console.log('updateWeatherInfo 被調用，weatherElements 數量:', weatherElements.length);
    
    // 尋找各個天氣元素（支援多種 API 格式）
    weatherElements.forEach((element, index) => {
        // 處理預報資料格式（F-D0047-023）
        const elementName = element.elementName || element.ElementName;
        const timeData = element.time || element.Time;
        
        console.log(`處理第 ${index} 個元素:`, elementName, 'timeData 數量:', timeData?.length);
        
        if (timeData && timeData.length > 0) {
            const currentData = timeData[0]; // 取第一個時間點的資料
            
            // 處理 ElementValue 陣列（大小寫兼容）
            const elementValue = currentData.ElementValue || currentData.elementValue;
            const firstValue = elementValue && elementValue.length > 0 ? elementValue[0] : null;
            
            console.log('elementName:', elementName, 'firstValue:', firstValue);
            
            switch (elementName) {
                case 'T':
                case 'Td':
                case '平均溫度':
                case '平均氣溫':
                    // 從 ElementValue[0].Temperature 取得溫度
                    const tempValue = firstValue?.Temperature || 
                                     firstValue?.temperature ||
                                     firstValue?.value ||
                                     currentData.elementValue?.find(v => v.value || v.Temperature)?.value ||
                                     currentData.elementValue?.find(v => v.value || v.Temperature)?.Temperature;
                    if (tempValue) {
                        temperature = `${tempValue}°C`;
                        console.log('設定溫度:', temperature);
                    } else {
                        console.log('未找到溫度值，firstValue:', firstValue);
                    }
                    break;
                    
                case 'RH':
                case '平均相對濕度':
                case '相對濕度':
                    // 從 ElementValue[0].RelativeHumidity 取得濕度
                    const humidityValue = firstValue?.RelativeHumidity ||
                                         firstValue?.relativeHumidity ||
                                         firstValue?.value ||
                                         currentData.elementValue?.find(v => v.value || v.RelativeHumidity)?.value ||
                                         currentData.elementValue?.find(v => v.value || v.RelativeHumidity)?.RelativeHumidity;
                    if (humidityValue) {
                        humidity = `${humidityValue}%`;
                        console.log('設定濕度:', humidity);
                    } else {
                        console.log('未找到濕度值，firstValue:', firstValue);
                    }
                    break;
                    
                case 'Wx':
                case '天氣現象':
                case '天氣':
                    // 從 ElementValue[0].Weather 取得天氣現象
                    const weatherParam = firstValue?.Weather ||
                                        firstValue?.weather ||
                                        firstValue?.parameter ||
                                        firstValue?.parameterName ||
                                        firstValue?.parameterValue ||
                                        firstValue?.value ||
                                        currentData.elementValue?.find(v => v.Weather || v.weather || v.parameter)?.Weather ||
                                        currentData.elementValue?.find(v => v.Weather || v.weather || v.parameter)?.weather ||
                                        currentData.elementValue?.find(v => v.Weather || v.weather || v.parameter)?.parameter;
                    if (weatherParam) {
                        weatherCondition = typeof weatherParam === 'string' 
                            ? weatherParam 
                            : (weatherParam.parameterName || weatherParam.parameterValue || weatherParam);
                        console.log('設定天氣狀況:', weatherCondition);
                    } else {
                        console.log('未找到天氣現象，firstValue:', firstValue);
                    }
                    break;
                    
                case 'WS':
                case '風速':
                case '平均風速':
                    // 從 ElementValue[0].WindSpeed 取得風速
                    const windValue = firstValue?.WindSpeed ||
                                     firstValue?.windSpeed ||
                                     firstValue?.WS ||
                                     firstValue?.ws ||
                                     firstValue?.value ||
                                     currentData.elementValue?.find(v => v.value || v.WindSpeed || v.WS)?.value ||
                                     currentData.elementValue?.find(v => v.value || v.WindSpeed || v.WS)?.WindSpeed ||
                                     currentData.elementValue?.find(v => v.value || v.WindSpeed || v.WS)?.WS;
                    if (windValue) {
                        windSpeed = `${windValue} km/h`;
                        console.log('設定風速:', windSpeed);
                    } else {
                        console.log('未找到風速值，firstValue:', firstValue);
                    }
                    break;
            }
        }
    });
    
    // 更新 DOM
    console.log('更新 DOM，最終值:', { temperature, humidity, weatherCondition, windSpeed });
    document.getElementById('temperature').textContent = temperature;
    document.getElementById('humidity').textContent = humidity;
    document.getElementById('weatherCondition').textContent = weatherCondition;
    document.getElementById('windSpeed').textContent = windSpeed;
}

// 等待字體載入
function waitForFonts() {
    return document.fonts.ready;
}

// 匯出圖片功能
async function exportImage() {
    const exportBtn = document.getElementById('exportBtn');
    exportBtn.disabled = true;
    exportBtn.textContent = '匯出中...';
    
    try {
        // 等待字體載入
        await waitForFonts();
        
        // 等待當前圖片載入完成
        const currentImg = document.getElementById('currentImage');
        await new Promise((resolve, reject) => {
            if (currentImg.complete && currentImg.naturalWidth > 0) {
                resolve();
            } else {
                currentImg.onload = resolve;
                currentImg.onerror = reject;
            }
        });
        
        // 創建 Canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 設定 Canvas 尺寸
        const imageWidth = currentImg.naturalWidth || currentImg.width;
        const imageHeight = currentImg.naturalHeight || currentImg.height;
        
        // 計算需要的資訊區域高度
        const scale = Math.min(imageWidth / 800, 1.5);
        const baseFontSize = Math.max(18, Math.min(28, 22 * scale));
        const titleFontSize = Math.max(22, Math.min(36, 28 * scale));
        const padding = 30 * scale;
        const lineHeight = baseFontSize * 1.6;
        
        // 計算實際需要的資訊高度
        const weatherInfoCount = 4;
        const weatherSectionHeight = titleFontSize + padding * 0.8 + weatherInfoCount * lineHeight + padding * 0.8;
        const creditHeight = baseFontSize * 0.85 + padding * 0.5;
        const totalInfoHeight = padding + weatherSectionHeight + creditHeight;
        
        // 決定資訊區域位置和 canvas 高度
        let canvasHeight = imageHeight;
        let infoStartY;
        let extendCanvas = false;
        
        // 如果資訊區域超過圖片高度的40%，則擴展 canvas
        if (totalInfoHeight > imageHeight * 0.4) {
            extendCanvas = true;
            canvasHeight = imageHeight + totalInfoHeight - (imageHeight * 0.3);
            infoStartY = imageHeight - (imageHeight * 0.3);
        } else {
            infoStartY = imageHeight - totalInfoHeight;
        }
        
        canvas.width = imageWidth;
        canvas.height = canvasHeight;
        
        // 繪製白色背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 繪製圖片
        ctx.drawImage(currentImg, 0, 0, imageWidth, imageHeight);
        
        // 計算實際資訊區域高度
        const infoHeight = canvasHeight - infoStartY;
        
        // 繪製漸變背景（從透明到半透明黑色）
        const gradient = ctx.createLinearGradient(0, infoStartY, 0, canvasHeight);
        if (extendCanvas) {
            // 如果擴展了 canvas，從圖片底部開始漸變
            const relativeStart = (infoStartY - imageHeight) / (canvasHeight - imageHeight);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
            gradient.addColorStop(Math.max(0, relativeStart), 'rgba(0, 0, 0, 0.4)');
            gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.6)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
        } else {
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, infoStartY, imageWidth, infoHeight);
        
        // 設定文字樣式
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // 設定文字陰影效果
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // 繪製天氣資訊標題
        ctx.font = `bold ${titleFontSize}px "Noto Serif TC", serif`;
        ctx.fillStyle = '#ffffff';
        const weatherTitleY = infoStartY + padding;
        ctx.fillText('天氣資訊', padding, weatherTitleY);
        
        // 繪製天氣資訊內容
        ctx.font = `${baseFontSize}px "Noto Serif TC", serif`;
        const weatherInfo = [
            { label: '溫度', value: document.getElementById('temperature').textContent },
            { label: '濕度', value: document.getElementById('humidity').textContent },
            { label: '天氣狀況', value: document.getElementById('weatherCondition').textContent },
            { label: '風速', value: document.getElementById('windSpeed').textContent }
        ];
        
        let yOffset = weatherTitleY + titleFontSize + padding * 0.8;
        
        weatherInfo.forEach((info, index) => {
            const y = yOffset + index * lineHeight;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = `${baseFontSize}px "Noto Serif TC", serif`;
            ctx.fillText(`${info.label}：`, padding, y);
            ctx.fillStyle = '#ffffff';
            ctx.font = `600 ${baseFontSize}px "Noto Serif TC", serif`;
            const labelWidth = ctx.measureText(`${info.label}：`).width;
            ctx.fillText(info.value, padding + labelWidth + 15 * scale, y);
        });
        
        // 繪製 Gemini 標示
        const creditY = yOffset + weatherInfo.length * lineHeight + padding * 0.5;
        ctx.font = `${baseFontSize * 0.85}px "Noto Serif TC", serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fontStyle = 'italic';
        const creditText = '圖片由 Gemini 生成';
        const creditWidth = ctx.measureText(creditText).width;
        ctx.fillText(creditText, imageWidth - creditWidth - padding, creditY);
        
        // 清除陰影效果
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // 轉換為 Blob 並下載
        canvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `鹿谷天氣_${currentImageIndex}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                throw new Error('無法生成圖片');
            }
        }, 'image/png');
        
    } catch (error) {
        console.error('匯出失敗:', error);
        alert('匯出失敗，請稍後再試');
    } finally {
        exportBtn.disabled = false;
        exportBtn.textContent = '匯出圖片';
    }
}

