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

        // 快速新增訂單按鈕
        document.getElementById('quickOrderBtn').addEventListener('click', () => {
            this.quickAddOrder();
        });

        // 倒數控制按鈕
        document.getElementById('endCountdownBtn').addEventListener('click', () => {
            this.endCountdownEarly();
        });

        document.getElementById('addTimeBtn').addEventListener('click', () => {
            this.addCountdownTime();
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
        const input = document.getEle
