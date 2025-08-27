// 白牌叫車 Demo 系統 - 主要邏輯
class TaxiSystem {
    constructor() {
        // 為每個使用者生成唯一ID，確保資料獨立
        this.userId = this.generateUserId();
        
        this.currentOrderNumber = 'A001';
        this.orderCounter = 1;
        this.currentOrder = null;
        this.countdownTimer = null;
        this.countdownSeconds = 60;
        this.isWaitingForDriver = false;
        this.driverBids = [];
        
        // 角色設定
        this.customerName = '潘潘';
        this.driverName = '甲司機';
        this.adminName = '服務人員';
        this.roleMode = 'admin'; // C群組：'driver' 或 'admin'
        this.roleModeA = 'customer'; // A群組：'customer' 或 'admin'
        
        this.initializeEventListeners();
        this.loadFromLocalStorage();
        this.updateSystemStatus();
        this.switchRoleMode(this.roleMode); // 確保C群組角色模式正確設定
        this.switchRoleModeA(this.roleModeA); // 確保A群組角色模式正確設定
    }

    // 初始化事件監聽器
    initializeEventListeners() {
        // 客戶群組發送按鈕
        document.getElementById('sendBtnA').addEventListener('click', () => {
            this.handleCustomerMessage();
        });

        // 客戶群組 Enter 鍵
        document.getElementById('inputA').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleCustomerMessage();
            }
        });

        // 客戶群組自動完成
        document.getElementById('inputA').addEventListener('input', (e) => {
            this.handleAutocomplete(e, 'A');
        });

        // 客戶群組貼上事件
        document.getElementById('inputA').addEventListener('paste', (e) => {
            this.handlePaste(e, 'A');
        });

        // 後台群組發送按鈕
        document.getElementById('sendBtnB').addEventListener('click', () => {
            this.handleAdminMessage();
        });

        // 後台群組 Enter 鍵
        document.getElementById('inputB').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleAdminMessage();
            }
        });

        // 後台群組自動完成
        document.getElementById('inputB').addEventListener('input', (e) => {
            this.handleAutocomplete(e, 'B');
        });

        // 後台群組貼上事件
        document.getElementById('inputB').addEventListener('paste', (e) => {
            this.handlePaste(e, 'B');
        });

        // 司機群組發送按鈕
        document.getElementById('sendBtnC').addEventListener('click', () => {
            this.handleDriverMessage();
        });

        // 司機群組 Enter 鍵
        document.getElementById('inputC').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleDriverMessage();
            }
        });

        // 司機群組自動完成
        document.getElementById('inputC').addEventListener('input', (e) => {
            this.handleAutocomplete(e, 'C');
        });

        // 司機群組貼上事件
        document.getElementById('inputC').addEventListener('paste', (e) => {
            this.handlePaste(e, 'C');
        });

        // 角色模式切換
        document.getElementById('roleMode').addEventListener('change', (e) => {
            this.switchRoleMode(e.target.value);
        });

        // 司機名稱選擇
        document.getElementById('driverName').addEventListener('change', (e) => {
            this.driverName = e.target.value;
            this.saveToLocalStorage();
        });



        // A群組角色模式切換
        document.getElementById('roleModeA').addEventListener('change', (e) => {
            this.roleModeA = e.target.value;
            this.switchRoleModeA(this.roleModeA);
            this.saveToLocalStorage();
        });

        // 客戶名稱選擇
        document.getElementById('customerName').addEventListener('change', (e) => {
            this.customerName = e.target.value;
            this.saveToLocalStorage();
        });



        // 小箭頭按鈕
        document.getElementById('toggleClearBtn').addEventListener('click', () => {
            this.toggleClearPanel();
        });

        // 清空按鈕
        document.getElementById('clearAllBtn').addEventListener('click', () => {
            this.showClearConfirmModal();
        });

        // 點擊其他地方隱藏自動完成面板
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.chat-input')) {
                this.hideAllAutocomplete();
            }
        });

        // 確認清空按鈕
        document.getElementById('confirmClearBtn').addEventListener('click', () => {
            this.clearAllMessages();
            this.hideClearConfirmModal();
            this.hideClearPanel();
        });

        // 取消清空按鈕
        document.getElementById('cancelClearBtn').addEventListener('click', () => {
            this.hideClearConfirmModal();
        });
    }

    // 處理客戶訊息
    handleCustomerMessage() {
        const input = document.getElementById('inputA');
        const message = input.value.trim();
        
        if (!message) return;

        if (this.roleModeA === 'customer') {
            // 客戶模式：檢查是否為叫車指令
            if (message.startsWith('@白牌叫車')) {
                this.processTaxiRequest(message);
            } else {
                // 一般訊息 - 只在 A 群顯示
                this.addMessage('A', this.customerName, message, 'customer');
            }
        } else {
            // 後台人員模式：發送後台管理訊息
            this.addMessage('A', '服務人員', message, 'admin');
        }

        input.value = '';
        this.saveToLocalStorage();
    }

    // 處理後台管理訊息
    handleAdminMessage() {
        const input = document.getElementById('inputB');
        const message = input.value.trim();
        
        if (!message) return;

        this.addMessage('B', '後台管理員', message, 'admin');
        input.value = '';
        this.saveToLocalStorage();
    }

    // 處理司機訊息
    handleDriverMessage() {
        const input = document.getElementById('inputC');
        const message = input.value.trim();
        
        if (!message) return;

        if (this.roleMode === 'driver') {
            // 司機模式：檢查是否為搶單指令
            if (message.startsWith('@白牌叫車') && this.isWaitingForDriver) {
                this.processDriverBid(message);
            } else {
                // 一般訊息
                this.addMessage('C', this.driverName, message, 'driver');
            }
        } else {
            // 後台人員模式：一般管理訊息
            this.addMessage('C', this.adminName, message, 'admin');
        }

        input.value = '';
        this.saveToLocalStorage();
    }

    // 處理叫車請求
    processTaxiRequest(message) {
        // 解析訊息：@白牌叫車 地址 [特殊需求]
        const parts = message.split(' ').filter(part => part.trim() !== '');
        if (parts.length < 2) {
            this.addMessage('A', '白牌叫車', '請輸入完整資訊：@白牌叫車 地址 [特殊需求]', 'system');
            return;
        }

        // 優先判斷地址，如果第二個部分是空的，則檢查第三個部分
        let address = '';
        let specialRequirements = '無';
        
        if (parts[1] && parts[1].trim() !== '') {
            address = parts[1];
            specialRequirements = parts.length > 2 ? parts.slice(2).join(' ') : '無';
        } else if (parts[2] && parts[2].trim() !== '') {
            address = parts[2];
            specialRequirements = parts.length > 3 ? parts.slice(3).join(' ') : '無';
        } else {
            this.addMessage('A', '白牌叫車', '請輸入有效地址：@白牌叫車 地址 [特殊需求]', 'system');
            return;
        }

        // 先顯示客戶的原始訊息（只在A群顯示）
        this.addMessage('A', this.customerName, message, 'customer');

        // 建立訂單
        this.currentOrder = {
            id: this.currentOrderNumber,
            address: address,
            specialRequirements: specialRequirements,
            customer: this.customerName,
            group: 'AA',
            timestamp: new Date(),
            status: 'waiting'
        };

        // 立即回覆客戶
        this.addMessage('A', '白牌叫車', `@${this.customerName} 馬上為您安排`, 'system');

        // 發送訂單通知到後台群組
        this.sendOrderNotificationToAdmin();

        // 開始等待司機搶單
        this.startWaitingForDriver();

        // 更新訂單編號
        this.orderCounter++;
        this.currentOrderNumber = `A${this.orderCounter.toString().padStart(3, '0')}`;
        this.updateSystemStatus();
    }

    // 發送訂單通知到後台群組
    sendOrderNotificationToAdmin() {
        const order = this.currentOrder;
        
        // 發送三行格式的訂單資訊（作為一個群組）
        this.addMessageGroup('B', '白牌叫車', [
            '新單通知！',
            order.address,
            `訂單編號：${order.id}\n` +
            `地址：${order.address}\n` +
            `特殊需求：${order.specialRequirements}\n` +
            `群組：${order.group}\n` +
            `乘客：${order.customer}`
        ], 'system');
    }

    // 開始等待司機搶單
    startWaitingForDriver() {
        this.isWaitingForDriver = true;
        this.driverBids = [];
        this.countdownSeconds = 60;
        this.updateSystemStatus();
        
        // 注意：C群組的訊息應該由後台人員手動複製貼上，不在這裡自動發送
        // 倒數計時會在C群組有「新單通知！」時才開始
    }

    // 開始倒數計時
    startCountdown() {
        this.updateCountdownDisplay();
        
        // 更新系統狀態為等待司機搶單
        document.getElementById('systemStatus').textContent = '等待司機搶單';
        
        this.countdownTimer = setInterval(() => {
            this.countdownSeconds--;
            this.updateCountdownDisplay();
            
            if (this.countdownSeconds <= 0) {
                this.checkDriverBids();
            }
        }, 1000);
    }

    // 更新倒數顯示
    updateCountdownDisplay() {
        const countdownElement = document.getElementById('countdown');
        if (this.isWaitingForDriver && this.countdownSeconds > 0) {
            const minutes = Math.floor(this.countdownSeconds / 60);
            const seconds = this.countdownSeconds % 60;
            if (minutes > 0) {
                countdownElement.textContent = `${minutes}分${seconds}秒`;
            } else {
                countdownElement.textContent = `${seconds}秒`;
            }
            countdownElement.className = 'countdown-active';
        } else {
            countdownElement.textContent = '--';
            countdownElement.className = '';
        }
    }

    // 處理司機搶單
    processDriverBid(message) {
        // 解析搶單格式：@白牌叫車 地標/車牌/顏色/時間
        const parts = message.split(' ');
        if (parts.length < 2) {
            this.addMessage('C', '白牌叫車', '請輸入完整搶單格式：@白牌叫車 地標/車牌/顏色/時間', 'system');
            return;
        }

        const bidInfo = parts[1].split('/');
        if (bidInfo.length !== 4) {
            this.addMessage('C', '白牌叫車', '搶單格式錯誤，請使用：地標/車牌/顏色/時間', 'system');
            return;
        }

        const [landmark, plateNumber, color, arrivalTime] = bidInfo;
        
        // 檢查車輛顏色是否符合特殊需求
        if (this.currentOrder.specialRequirements.includes('不要黑色車') && color === '黑') {
            this.addMessage('C', '白牌叫車', `${this.driverName}，您的車輛顏色不符合客戶需求`, 'system');
            return;
        }

        // 記錄搶單資訊
        this.driverBids.push({
            driver: this.driverName,
            landmark: landmark,
            plateNumber: plateNumber,
            color: color,
            arrivalTime: parseInt(arrivalTime),
            timestamp: new Date()
        });

        // 顯示司機的搶單訊息
        this.addMessage('C', this.driverName, message, 'driver');
    }

    // 檢查司機搶單結果
    checkDriverBids() {
        clearInterval(this.countdownTimer);
        
        if (this.driverBids.length === 0) {
            // 無人搶單，重新開始（不向C群組發送訊息）
            this.countdownSeconds = 60;
            this.startWaitingForDriver();
            return;
        }

        // 選擇最佳司機（符合顏色需求且時間最短）
        const validBids = this.driverBids.filter(bid => {
            if (this.currentOrder.specialRequirements.includes('不要黑色車') && bid.color === '黑') {
                return false;
            }
            return true;
        });

        if (validBids.length === 0) {
            // 沒有符合需求的司機，重新開始（不向C群組發送訊息）
            this.countdownSeconds = 60;
            this.startWaitingForDriver();
            return;
        }

        // 選擇抵達時間最短的司機
        const bestDriver = validBids.reduce((best, current) => {
            return current.arrivalTime < best.arrivalTime ? current : best;
        });

        // 處理搶單成功
        this.processSuccessfulBid(bestDriver);
    }

    // 處理搶單成功
    processSuccessfulBid(driver) {
        this.isWaitingForDriver = false;
        this.currentOrder.status = 'assigned';
        this.currentOrder.assignedDriver = driver;
        
        // 發送4個訊息到後台群組
        this.sendBidSuccessNotification(driver);
        
        // 更新系統狀態為搶單成功狀態
        document.getElementById('systemStatus').textContent = '請告知搶單與派車結果';
        document.getElementById('systemStatus').className = 'order-active';
        
        // 更新倒數顯示
        this.updateCountdownDisplay();
    }

    // 發送搶單成功通知到後台群組
    sendBidSuccessNotification(driver) {
        const order = this.currentOrder;
        
        // 使用群組訊息發送4則通知
        this.addMessageGroup('B', '白牌叫車', [
            '接單通知！',
            `訂單編號：${order.id}\n` +
            `地址：${order.address}\n` +
            `特殊需求：${order.specialRequirements}\n` +
            `群組：${order.group}\n` +
            `乘客：${order.customer}`,
            `@${driver.driver} ${order.address} 接單成功`,
            `@${order.customer}\n` +
            `${order.address}\n` +
            `車牌號碼：${driver.plateNumber}\n` +
            `車輛顏色：${driver.color}\n` +
            `${driver.arrivalTime}分後司機抵達`
        ], 'system');
    }

    // 新增訊息到指定群組
    addMessage(groupId, sender, content, type) {
        const messagesContainer = document.getElementById(`messages${groupId}`);
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const time = new Date().toLocaleTimeString('zh-TW', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
        });
        
        // 根據類型設定頭像
        let avatarText = '';
        let avatarClass = '';
        
        switch(type) {
            case 'customer':
                avatarText = sender.charAt(0);
                avatarClass = 'customer';
                break;
            case 'system':
                avatarText = `<svg height="20" viewBox="0 0 512 512" width="20" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2_00000140001274174366788610000017023508329787192509_"><g id="maps"><path id="car_" d="m451.6 49.7c-2.1-6.3-6.3-11.8-11.7-15.6-5.5-3.8-12.1-5.8-18.8-5.7h-330.1c-6.7-.1-13.3 1.9-18.8 5.7s-9.6 9.3-11.7 15.6l-60.5 182.1v230.4c-.4 11.4 8.6 21 20 21.3h1.4 14.2c11.4.4 21-8.6 21.3-20 0-.4 0-.9 0-1.3v-38.4h398.2v38.4c0 6.2 1.9 11.3 5.7 15.3s8.8 6 14.9 6h14.9c11.4.4 21-8.6 21.3-20 0-.4 0-.9 0-1.3v-230.4zm-306.2 284.5c-7.3 7.6-16.5 11.4-27.4 11.4-10.4.2-20.5-3.8-28.1-11-7.7-7-12-17-11.7-27.4.1-21.9 17.9-39.7 39.8-39.8 10.4-.2 20.4 4.1 27.4 11.7 7.2 7.5 11.2 17.6 11 28.1.1 10.1-3.8 19.9-11 27zm277.4 0c-7.4 7.4-17.6 11.5-28.1 11.4-10.1.1-19.8-3.8-27-11-7.6-7.3-11.4-16.5-11.4-27.4-.2-10.4 3.8-20.5 11-28.1 7-7.7 17-12 27.4-11.7 21.9.1 39.7 17.9 39.8 39.8 0 10.4-3.9 19.5-11.7 27zm-363.8-145.1 39.1-118h315.7l39.2 118z"/></g></g></svg>`;
                avatarClass = 'system';
                break;
            case 'system-no-avatar':
                avatarText = '';
                avatarClass = 'system-no-avatar';
                break;
            case 'driver':
                avatarText = `<svg id="Capa_1" enable-background="new 0 0 510.099 510.099" height="512" viewBox="0 0 510.099 510.099" width="512" xmlns="http://www.w3.org/2000/svg"><g><g><circle cx="255.049" cy="255.05" r="15"/><path d="m390.049 285.05c9.217 0 18.103 1.399 26.476 3.974 5.774-27.48 4.526-56.57-4.265-84.087-88.391-53.222-226.128-53.164-314.422 0-8.788 27.506-10.041 56.596-4.264 84.087 8.372-2.574 17.259-3.974 26.476-3.974 49.706 0 90 40.295 90 90 0 12.95-2.756 25.25-7.68 36.376 34.019 11.491 71.266 11.516 105.361 0-4.925-11.126-7.681-23.426-7.681-36.376-.001-49.706 40.294-90 89.999-90zm-135 15c-24.813 0-45-20.186-45-45s20.187-45 45-45c24.812 0 45 20.186 45 45s-20.187 45-45 45z"/><path d="m381.917 106.969 42.522-42.521c-96.398-85.893-242.294-85.969-338.777 0l42.521 42.521c72.985-62.587 180.749-62.587 253.734 0z"/><path d="m106.97 128.182-42.522-42.521c-85.893 96.397-85.969 242.295 0 338.776l42.521-42.521c-62.588-72.985-62.587-180.749.001-253.734z"/><path d="m128.183 403.13-42.522 42.52c96.397 85.893 242.293 85.97 338.776 0l-42.521-42.521c-72.986 62.589-180.749 62.588-253.733.001z"/><path d="m445.651 85.661-42.521 42.522c62.588 72.985 62.588 180.75 0 253.734l42.52 42.521c85.895-96.4 85.968-242.297.001-338.777z"/></g></g></svg>`;
                avatarClass = 'driver';
                break;
            case 'admin':
                avatarText = `<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 415.744 415.744" style="enable-background:new 0 0 415.744 415.744;" xml:space="preserve"><g><g><path d="M207.872,0c-53.76,0-97.28,43.52-97.28,97.28s43.52,97.28,97.28,97.28s97.28-43.52,97.28-97.28S261.632,0,207.872,0z"/></g></g><g><g><path d="M245.76,205.824h-75.776c-76.288,0-138.24,61.952-138.24,138.24v56.32c0,8.704,6.656,15.36,15.36,15.36H368.64c8.704,0,15.36-6.656,15.36-15.36v-56.32C384,267.776,322.048,205.824,245.76,205.824z"/></g></g></svg>`;
                avatarClass = 'customer'; // 使用customer樣式
                break;
        }
        
        if (type === 'system-no-avatar') {
            messageDiv.innerHTML = `
                <div class="bubble">
                    <div class="content">${content}</div>
                    <div class="time">${time}</div>
                </div>
            `;
        } else {
            // 所有類型：時間都在氣泡內部
            messageDiv.innerHTML = `
                <div class="avatar-container">
                    <div class="avatar ${avatarClass}">${avatarText}</div>
                    <div class="name">${sender}</div>
                </div>
                <div class="bubble">
                    <div class="content">${content}</div>
                    <div class="time">${time}</div>
                </div>
            `;
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // 檢查是否在C群組添加了「新單通知！」訊息
        if (groupId === 'C' && content === '新單通知！' && this.isWaitingForDriver) {
            this.startCountdown();
        }
    }

    // 新增訊息群組到指定群組
    addMessageGroup(groupId, sender, messages, type) {
        const messagesContainer = document.getElementById(`messages${groupId}`);
        const groupDiv = document.createElement('div');
        groupDiv.className = 'message-group';
        
        const time = new Date().toLocaleTimeString('zh-TW', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
        });
        
        // 根據類型設定頭像
        let avatarText = '';
        let avatarClass = '';
        
        switch(type) {
            case 'system':
                avatarText = `<svg height="20" viewBox="0 0 512 512" width="20" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2_00000140001274174366788610000017023508329787192509_"><g id="maps"><path id="car_" d="m451.6 49.7c-2.1-6.3-6.3-11.8-11.7-15.6-5.5-3.8-12.1-5.8-18.8-5.7h-330.1c-6.7-.1-13.3 1.9-18.8 5.7s-9.6 9.3-11.7 15.6l-60.5 182.1v230.4c-.4 11.4 8.6 21 20 21.3h1.4 14.2c11.4.4 21-8.6 21.3-20 0-.4 0-.9 0-1.3v-38.4h398.2v38.4c0 6.2 1.9 11.3 5.7 15.3s8.8 6 14.9 6h14.9c11.4.4 21-8.6 21.3-20 0-.4 0-.9 0-1.3v-230.4zm-306.2 284.5c-7.3 7.6-16.5 11.4-27.4 11.4-10.4.2-20.5-3.8-28.1-11-7.7-7-12-17-11.7-27.4.1-21.9 17.9-39.7 39.8-39.8 10.4-.2 20.4 4.1 27.4 11.7 7.2 7.5 11.2 17.6 11 28.1.1 10.1-3.8 19.9-11 27zm277.4 0c-7.4 7.4-17.6 11.5-28.1 11.4-10.1.1-19.8-3.8-27-11-7.6-7.3-11.4-16.5-11.4-27.4-.2-10.4 3.8-20.5 11-28.1 7-7.7 17-12 27.4-11.7 21.9.1 39.7 17.9 39.8 39.8 0 10.4-3.9 19.5-11.7 27zm-363.8-145.1 39.1-118h315.7l39.2 118z"/></g></g></svg>`;
                avatarClass = 'system';
                break;
        }
        
        // 創建頭像容器（只在第一個訊息顯示）
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'avatar-container';
        avatarContainer.innerHTML = `
            <div class="avatar ${avatarClass}">${avatarText}</div>
            <div class="name">${sender}</div>
        `;
        
        // 創建訊息容器
        const messagesDiv = document.createElement('div');
        messagesDiv.className = 'group-messages';
        
        // 為每個訊息創建氣泡
        messages.forEach((content, index) => {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'group-message';
            
            messageDiv.innerHTML = `
                <div class="bubble">
                    <div class="content">${content}</div>
                    ${index === messages.length - 1 ? `<div class="time">${time}</div>` : ''}
                </div>
            `;
            
            messagesDiv.appendChild(messageDiv);
        });
        
        groupDiv.appendChild(avatarContainer);
        groupDiv.appendChild(messagesDiv);
        
        messagesContainer.appendChild(groupDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }







    // 切換角色模式
    switchRoleMode(mode) {
        this.roleMode = mode;
        const driverSelector = document.getElementById('driverSelector');
        const adminSelector = document.getElementById('adminSelector');
        const inputC = document.getElementById('inputC');
        
        if (mode === 'driver') {
            driverSelector.style.display = 'flex';
            adminSelector.style.display = 'none';
            inputC.placeholder = '輸入 @白牌叫車 地標/車牌/顏色/時間';
        } else {
            driverSelector.style.display = 'none';
            adminSelector.style.display = 'none'; // 後台人員模式不顯示任何選單
            inputC.placeholder = '後台管理訊息';
        }
        
        this.saveToLocalStorage();
    }

    // 切換A群組角色模式
    switchRoleModeA(mode) {
        this.roleModeA = mode;
        const customerSelector = document.getElementById('customerSelector');
        const adminSelectorA = document.getElementById('adminSelectorA');
        const inputA = document.getElementById('inputA');
        
        if (mode === 'customer') {
            customerSelector.style.display = 'flex';
            adminSelectorA.style.display = 'none';
            inputA.placeholder = '輸入 @白牌叫車 + 地址 + [特殊需求]';
        } else {
            customerSelector.style.display = 'none';
            adminSelectorA.style.display = 'none'; // 後台人員模式不顯示任何選單
            inputA.placeholder = '後台管理訊息';
        }
        
        this.saveToLocalStorage();
    }

    // 切換清空面板顯示
    toggleClearPanel() {
        const panel = document.getElementById('clearPanel');
        const toggleBtn = document.getElementById('toggleClearBtn');
        
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            toggleBtn.classList.add('active');
        } else {
            panel.style.display = 'none';
            toggleBtn.classList.remove('active');
        }
    }

    // 顯示清空確認對話框
    showClearConfirmModal() {
        document.getElementById('confirmModal').style.display = 'block';
    }

    // 隱藏清空確認對話框
    hideClearConfirmModal() {
        document.getElementById('confirmModal').style.display = 'none';
    }

    // 隱藏清空面板
    hideClearPanel() {
        const panel = document.getElementById('clearPanel');
        const toggleBtn = document.getElementById('toggleClearBtn');
        panel.style.display = 'none';
        toggleBtn.classList.remove('active');
    }

    // 處理自動完成
    handleAutocomplete(event, groupId) {
        const input = event.target;
        const value = input.value;
        const autocompletePanel = document.getElementById(`autocomplete${groupId}`);
        
        // 檢查是否輸入 @ 符號
        if (value.includes('@')) {
            // 顯示自動完成面板
            this.showAutocomplete(groupId);
            
            // 為自動完成項目添加點擊事件
            this.setupAutocompleteItems(groupId);
        } else {
            // 隱藏自動完成面板
            this.hideAutocomplete(groupId);
        }
    }

    // 顯示自動完成面板
    showAutocomplete(groupId) {
        const autocompletePanel = document.getElementById(`autocomplete${groupId}`);
        autocompletePanel.style.display = 'block';
    }

    // 隱藏自動完成面板
    hideAutocomplete(groupId) {
        const autocompletePanel = document.getElementById(`autocomplete${groupId}`);
        autocompletePanel.style.display = 'none';
    }

    // 隱藏所有自動完成面板
    hideAllAutocomplete() {
        ['A', 'B', 'C'].forEach(groupId => {
            this.hideAutocomplete(groupId);
        });
    }

    // 設置自動完成項目的事件
    setupAutocompleteItems(groupId) {
        const autocompletePanel = document.getElementById(`autocomplete${groupId}`);
        const items = autocompletePanel.querySelectorAll('.autocomplete-item');
        
        items.forEach(item => {
            // 移除舊的事件監聽器
            item.removeEventListener('click', this.handleItemClick);
            
            // 添加新的事件監聽器
            item.addEventListener('click', (e) => {
                this.handleItemClick(e, groupId);
            });
        });
    }

    // 處理自動完成項目點擊
    handleItemClick(event, groupId) {
        const selectedValue = event.target.getAttribute('data-value');
        const input = document.getElementById(`input${groupId}`);
        
        // 將選中的值填入輸入框
        input.value = selectedValue + ' ';
        
        // 隱藏自動完成面板
        this.hideAutocomplete(groupId);
        
        // 聚焦到輸入框
        input.focus();
    }

    // 處理貼上事件
    handlePaste(event, groupId) {
        // 阻止預設的貼上行為
        event.preventDefault();
        
        // 獲取剪貼簿內容
        const clipboardData = event.clipboardData || window.clipboardData;
        const pastedText = clipboardData.getData('text');
        
        // 處理貼上的文字，保持換行格式
        const processedText = this.processPastedText(pastedText);
        
        // 將處理後的文字插入到輸入框
        const input = document.getElementById(`input${groupId}`);
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const currentValue = input.value;
        
        // 插入處理後的文字
        input.value = currentValue.substring(0, start) + processedText + currentValue.substring(end);
        
        // 設定游標位置
        const newPosition = start + processedText.length;
        input.setSelectionRange(newPosition, newPosition);
        
        // 聚焦到輸入框
        input.focus();
    }

    // 處理貼上的文字格式
    processPastedText(text) {
        // 移除HTML標籤，只保留純文字
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;
        const plainText = tempDiv.textContent || tempDiv.innerText || '';
        
        // 保持換行格式，將各種換行符號統一為 \n
        return plainText
            .replace(/\r\n/g, '\n')  // Windows 換行
            .replace(/\r/g, '\n')    // Mac 換行
            .replace(/\n\n+/g, '\n') // 多個連續換行合併為一個
            .trim();                 // 移除首尾空白
    }



    // 清空所有訊息
    clearAllMessages() {
        // 清空所有群組的訊息
        ['A', 'B', 'C'].forEach(groupId => {
            const container = document.getElementById(`messages${groupId}`);
            container.innerHTML = '';
        });

        // 重置系統狀態
        this.currentOrder = null;
        this.isWaitingForDriver = false;
        this.driverBids = [];
        this.countdownSeconds = 30;
        
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }

        // 更新顯示
        this.updateSystemStatus();
        this.updateCountdownDisplay();
        
        // 清空本地儲存
        localStorage.removeItem('taxiSystemData');
        
        this.addMessage('A', '系統', '聊天室已清空，可以開始新的 demo', 'system');
    }

    // 更新系統狀態顯示
    updateSystemStatus() {
        document.getElementById('currentOrderNumber').textContent = this.currentOrderNumber;
        
        if (this.isWaitingForDriver) {
            document.getElementById('systemStatus').textContent = '等待後台人員操作';
            document.getElementById('systemStatus').className = 'order-active';
        } else {
            document.getElementById('systemStatus').textContent = '待機中';
            document.getElementById('systemStatus').className = '';
        }
    }

    // 生成唯一使用者ID
    generateUserId() {
        let userId = localStorage.getItem('taxiSystemUserId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('taxiSystemUserId', userId);
        }
        return userId;
    }

    // 儲存到本地儲存
    saveToLocalStorage() {
        const data = {
            customerName: this.customerName,
            driverName: this.driverName,
            adminName: this.adminName,
            roleMode: this.roleMode,
            roleModeA: this.roleModeA,
            currentOrderNumber: this.currentOrderNumber,
            orderCounter: this.orderCounter
        };
        localStorage.setItem(`taxiSystemData_${this.userId}`, JSON.stringify(data));
    }

    // 從本地儲存載入
    loadFromLocalStorage() {
        const data = localStorage.getItem(`taxiSystemData_${this.userId}`);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                this.customerName = parsed.customerName || '潘潘';
                this.driverName = parsed.driverName || '甲司機';
                this.adminName = parsed.adminName || '服務人員';
                this.roleMode = 'admin'; // 每次載入都預設為後台人員模式
                this.roleModeA = 'customer'; // 每次載入都預設為客戶模式
                this.currentOrderNumber = parsed.currentOrderNumber || 'A001';
                this.orderCounter = parsed.orderCounter || 1;
                
                // 更新輸入框顯示
                document.getElementById('customerName').value = this.customerName;
                document.getElementById('driverName').value = this.driverName;
                document.getElementById('roleMode').value = this.roleMode;
                document.getElementById('roleModeA').value = this.roleModeA;
                this.switchRoleMode(this.roleMode);
                this.switchRoleModeA(this.roleModeA);
            } catch (e) {
                console.error('載入本地儲存失敗:', e);
            }
        }
    }
}

// 當頁面載入完成後初始化系統
document.addEventListener('DOMContentLoaded', () => {
    window.taxiSystem = new TaxiSystem();
    
    // 不顯示任何提示訊息，保持對話窗乾淨
});
