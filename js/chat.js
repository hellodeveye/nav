/**
 * AI Chat Module
 * Clean, modular implementation following best practices
 */

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const CHAT_CONFIG = {
    API: {
        URL: 'https://api.openai.com/v1/chat/completions',
        MODEL: 'gpt-3.5-turbo',
        SYSTEM_PROMPT: '你是 AI 人工智能助手。',
        THINKING: 'disabled'
    },
    STORAGE_KEYS: {
        API_KEY: 'arkApiKey',
        CHAT_HISTORY: 'chatHistory'
    },
    UI: {
        FOCUS_DELAY: 300,
        TOAST_DURATION: 3000
    },
    SSE: {
        DATA_PREFIX: 'data: ',
        DONE_MESSAGE: '[DONE]'
    }
};

// ============================================================================
// STORAGE MANAGER
// ============================================================================

/**
 * Manages all localStorage operations
 */
class StorageManager {
    /**
     * Get stored API key
     * @returns {string|null}
     */
    static getApiKey() {
        try {
            return localStorage.getItem(CHAT_CONFIG.STORAGE_KEYS.API_KEY);
        } catch (e) {
            console.error('Failed to get API key:', e);
            return null;
        }
    }

    /**
     * Save API key to storage
     * @param {string} key
     */
    static saveApiKey(key) {
        try {
            localStorage.setItem(CHAT_CONFIG.STORAGE_KEYS.API_KEY, key);
        } catch (e) {
            console.error('Failed to save API key:', e);
            throw new Error('无法保存 API Key');
        }
    }

    /**
     * Remove API key from storage
     */
    static removeApiKey() {
        try {
            localStorage.removeItem(CHAT_CONFIG.STORAGE_KEYS.API_KEY);
        } catch (e) {
            console.error('Failed to remove API key:', e);
        }
    }

    /**
     * Get chat history
     * @returns {Array}
     */
    static getHistory() {
        try {
            const history = localStorage.getItem(CHAT_CONFIG.STORAGE_KEYS.CHAT_HISTORY);
            return history ? JSON.parse(history) : [];
        } catch (e) {
            console.error('Failed to load history:', e);
            // Clear corrupted data
            this.clearHistory();
            return [];
        }
    }

    /**
     * Save chat history
     * @param {Array} history
     */
    static saveHistory(history) {
        try {
            localStorage.setItem(CHAT_CONFIG.STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(history));
        } catch (e) {
            console.error('Failed to save history:', e);
        }
    }

    /**
     * Clear chat history
     */
    static clearHistory() {
        try {
            localStorage.removeItem(CHAT_CONFIG.STORAGE_KEYS.CHAT_HISTORY);
        } catch (e) {
            console.error('Failed to clear history:', e);
        }
    }
}

// ============================================================================
// STREAM PROCESSOR
// ============================================================================

/**
 * Processes Server-Sent Events (SSE) streams
 */
class StreamProcessor {
    /**
     * Process SSE stream and call callbacks
     * @param {ReadableStreamDefaultReader} reader
     * @param {Function} onChunk - Called with each content chunk
     * @param {Function} onComplete - Called with full response
     */
    static async processStream(reader, onChunk, onComplete) {
        const decoder = new TextDecoder('utf-8');
        let fullResponse = '';
        let buffer = '';
        let isFirstContent = true;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep incomplete line

                let chunkContent = '';

                for (const line of lines) {
                    const content = this.parseSSELine(line);
                    if (content) {
                        chunkContent += content;
                    }
                }

                if (chunkContent) {
                    // Remove leading newlines only from first chunk
                    if (isFirstContent) {
                        chunkContent = chunkContent.replace(/^[\r\n]+/, '');
                        isFirstContent = false;
                    }
                    fullResponse += chunkContent;
                    onChunk(fullResponse);
                }
            }

            onComplete(fullResponse);
        } catch (error) {
            console.error('Stream processing error:', error);
            throw error;
        }
    }

    /**
     * Parse a single SSE line
     * @param {string} line
     * @returns {string} Extracted content or empty string
     */
    static parseSSELine(line) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine === `${CHAT_CONFIG.SSE.DATA_PREFIX}${CHAT_CONFIG.SSE.DONE_MESSAGE}`) {
            return '';
        }

        if (trimmedLine.startsWith(CHAT_CONFIG.SSE.DATA_PREFIX)) {
            try {
                const dataStr = trimmedLine.slice(CHAT_CONFIG.SSE.DATA_PREFIX.length);
                const data = JSON.parse(dataStr);
                return this.extractContent(data.choices[0]?.delta);
            } catch (e) {
                console.warn('Failed to parse SSE line:', e);
                return '';
            }
        }

        return '';
    }

    /**
     * Extract content from delta object
     * @param {Object} delta
     * @returns {string}
     */
    static extractContent(delta) {
        if (!delta) return '';
        const content = delta.content || '';
        const reasoning = delta.reasoning_content || '';
        return reasoning + content;
    }
}

// ============================================================================
// MESSAGE RENDERER
// ============================================================================

/**
 * Handles rendering messages to the DOM
 */
class MessageRenderer {
    /**
     * @param {HTMLElement} container - Messages container element
     */
    constructor(container) {
        this.container = container;
    }

    /**
     * Render a user message
     * @param {string} content
     */
    renderUserMessage(content) {
        const messageEl = this.createMessageElement('user', content);
        this.container.appendChild(messageEl);
        this.scrollToBottom();
    }

    /**
     * Render an AI message
     * @param {string} content
     * @param {string} id - Optional message ID
     * @returns {string} Message ID
     */
    renderAIMessage(content = '', id = null) {
        const messageId = id || `ai-msg-${Date.now()}`;
        const messageEl = this.createMessageElement('ai', content, messageId);
        this.container.appendChild(messageEl);
        this.scrollToBottom();
        return messageId;
    }

    /**
     * Render loading indicator
     * @returns {string} Loading element ID
     */
    renderLoading() {
        const id = `loading-${Date.now()}`;
        const div = document.createElement('div');
        div.className = 'message ai';
        div.id = id;
        div.innerHTML = `
            <div class="message-avatar">
                <i class="ph-fill ph-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        this.container.appendChild(div);
        this.scrollToBottom();
        return id;
    }

    /**
     * Render error message
     * @param {string} message
     */
    renderError(message) {
        const div = document.createElement('div');
        div.className = 'message ai';
        div.innerHTML = `
            <div class="message-avatar">
                <i class="ph-fill ph-robot"></i>
            </div>
            <div class="message-content">${this.escapeHtml(message)}</div>
        `;
        this.container.appendChild(div);
        this.scrollToBottom();
    }

    /**
     * Update message content by ID
     * @param {string} id
     * @param {string} content
     */
    updateMessage(id, content) {
        const messageEl = document.getElementById(id);
        if (messageEl) {
            const contentEl = messageEl.querySelector('.message-content');
            if (contentEl) {
                contentEl.innerHTML = this.formatText(content);
            }
        }
    }

    /**
     * Remove message by ID
     * @param {string} id
     */
    removeMessage(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    /**
     * Clear all messages
     */
    clearAll() {
        this.container.innerHTML = '';
    }

    /**
     * Scroll to bottom of container
     */
    scrollToBottom() {
        this.container.scrollTop = this.container.scrollHeight;
    }

    /**
     * Create a message element
     * @private
     */
    createMessageElement(role, content, id = null) {
        const div = document.createElement('div');
        div.className = `message ${role}`;
        if (id) div.id = id;

        const icon = role === 'ai' ? 'ph-robot' : 'ph-user';
        div.innerHTML = `
            <div class="message-avatar">
                <i class="ph-fill ${icon}"></i>
            </div>
            <div class="message-content">${this.formatText(content)}</div>
        `;
        return div;
    }

    /**
     * Format text for display (convert newlines to <br>)
     * @private
     */
    formatText(text) {
        return this.escapeHtml(text).replace(/\n/g, '<br>');
    }

    /**
     * Escape HTML to prevent XSS
     * @private
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ============================================================================
// UI MANAGER
// ============================================================================

/**
 * Manages UI state and interactions
 */
class UIManager {
    constructor(elements) {
        this.elements = elements;
        this.initCustomUI();
    }

    /**
     * Show authentication view
     */
    showAuthView() {
        this.elements.authView.style.display = 'flex';
        this.elements.chatInterface.style.display = 'none';
        setTimeout(() => this.elements.apiKeyInput.focus(), CHAT_CONFIG.UI.FOCUS_DELAY);
    }

    /**
     * Show chat interface
     */
    showChatView() {
        this.elements.authView.style.display = 'none';
        this.elements.chatInterface.style.display = 'flex';
        setTimeout(() => this.elements.chatInput.focus(), CHAT_CONFIG.UI.FOCUS_DELAY);
    }

    /**
     * Show toast notification
     * @param {string} message
     */
    showToast(message) {
        const toast = document.getElementById('custom-toast');
        const msgSpan = document.getElementById('toast-msg');
        if (toast && msgSpan) {
            msgSpan.textContent = message;
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, CHAT_CONFIG.UI.TOAST_DURATION);
        }
    }

    /**
     * Show confirmation dialog
     * @param {string} title
     * @param {string} content
     * @param {Function} onConfirm
     */
    showConfirm(title, content, onConfirm) {
        const overlay = document.getElementById('custom-confirm');
        const titleEl = document.getElementById('confirm-title');
        const contentEl = document.getElementById('confirm-content');
        const okBtn = document.getElementById('confirm-ok');
        const cancelBtn = document.getElementById('confirm-cancel');

        if (!overlay) return;

        titleEl.textContent = title;
        contentEl.textContent = content;
        overlay.classList.add('show');

        // Clean up previous listeners
        const newOkBtn = okBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        const close = () => {
            overlay.classList.remove('show');
        };

        newOkBtn.onclick = () => {
            onConfirm();
            close();
        };

        newCancelBtn.onclick = close;
    }

    /**
     * Update textarea height based on content
     * @param {HTMLTextAreaElement} textarea
     */
    updateInputHeight(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    /**
     * Initialize custom UI elements (toast, confirm dialog)
     * @private
     */
    initCustomUI() {
        // Create toast if not exists
        if (!document.getElementById('custom-toast')) {
            const toast = document.createElement('div');
            toast.id = 'custom-toast';
            toast.className = 'custom-toast';
            toast.innerHTML = '<i class="ph-fill ph-check-circle"></i><span id="toast-msg"></span>';
            document.body.appendChild(toast);
        }

        // Create confirm dialog if not exists
        if (!document.getElementById('custom-confirm')) {
            const confirm = document.createElement('div');
            confirm.id = 'custom-confirm';
            confirm.className = 'custom-confirm-overlay';
            confirm.innerHTML = `
                <div class="custom-confirm-box">
                    <div class="confirm-header">
                        <i class="ph-fill ph-warning-circle"></i>
                        <span id="confirm-title">提示</span>
                    </div>
                    <div class="confirm-content" id="confirm-content"></div>
                    <div class="confirm-actions">
                        <button class="confirm-btn cancel" id="confirm-cancel">取消</button>
                        <button class="confirm-btn confirm" id="confirm-ok">确定</button>
                    </div>
                </div>
            `;
            document.body.appendChild(confirm);
        }
    }
}

// ============================================================================
// CHAT API CLIENT
// ============================================================================

/**
 * Handles communication with the chat API
 */
class ChatAPIClient {
    /**
     * @param {string} apiKey
     */
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * Send a message and get streaming response
     * @param {Array} messages - Chat history including system message
     * @returns {Promise<ReadableStreamDefaultReader>}
     */
    async sendMessage(messages) {
        const response = await fetch(CHAT_CONFIG.API.URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'Accept': 'text/event-stream'
            },
            body: JSON.stringify({
                model: CHAT_CONFIG.API.MODEL,
                messages: messages,
                stream: true,
                thinking: {
                    type: CHAT_CONFIG.API.THINKING
                }
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('401');
            }
            throw new Error(`API Error: ${response.status}`);
        }

        return response.body.getReader();
    }
}

// ============================================================================
// CHAT CONTROLLER
// ============================================================================

/**
 * Main controller orchestrating the chat functionality
 */
class ChatController {
    constructor() {
        this.chatHistory = [];
        this.isComposing = false;
        this.elements = this.getElements();

        if (!this.elements.chatFab || !this.elements.modal) {
            console.warn('Chat elements not found');
            return;
        }

        this.renderer = new MessageRenderer(this.elements.messagesContainer);
        this.uiManager = new UIManager(this.elements);

        this.init();
    }

    /**
     * Get all required DOM elements
     * @private
     */
    getElements() {
        return {
            chatFab: document.getElementById('chat-fab'),
            modal: document.getElementById('chat-modal'),
            closeBtn: document.getElementById('chat-close'),
            authView: document.getElementById('chat-auth'),
            chatInterface: document.getElementById('chat-interface'),
            apiKeyInput: document.getElementById('api-key-input'),
            saveKeyBtn: document.getElementById('save-key-btn'),
            clearKeyBtn: document.getElementById('clear-key-btn'),
            clearHistoryBtn: document.getElementById('clear-history-btn'),
            chatInput: document.getElementById('chat-input'),
            sendBtn: document.getElementById('send-btn'),
            messagesContainer: document.getElementById('chat-messages')
        };
    }

    /**
     * Initialize the chat controller
     */
    init() {
        this.loadHistory();
        this.attachEventListeners();
    }

    /**
     * Load chat history from storage
     * @private
     */
    loadHistory() {
        this.chatHistory = StorageManager.getHistory();
        this.chatHistory.forEach(msg => {
            if (msg.role === 'user' || msg.role === 'assistant') {
                const role = msg.role === 'assistant' ? 'ai' : 'user';
                if (role === 'user') {
                    this.renderer.renderUserMessage(msg.content);
                } else {
                    this.renderer.renderAIMessage(msg.content);
                }
            }
        });
    }

    /**
     * Attach all event listeners
     * @private
     */
    attachEventListeners() {
        // Modal controls
        this.elements.chatFab.addEventListener('click', () => this.handleOpenModal());
        this.elements.closeBtn.addEventListener('click', () => this.handleCloseModal());
        this.elements.modal.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) {
                this.handleCloseModal();
            }
        });

        // API Key management
        this.elements.saveKeyBtn.addEventListener('click', () => this.handleSaveApiKey());
        this.elements.clearKeyBtn.addEventListener('click', () => this.handleClearApiKey());

        // History management
        if (this.elements.clearHistoryBtn) {
            this.elements.clearHistoryBtn.addEventListener('click', () => this.handleClearHistory());
        }

        // Message input
        this.elements.chatInput.addEventListener('input', () => this.handleInputChange());
        this.elements.sendBtn.addEventListener('click', () => this.handleSendMessage());

        // IME composition tracking
        this.elements.chatInput.addEventListener('compositionstart', () => {
            this.isComposing = true;
        });
        this.elements.chatInput.addEventListener('compositionend', () => {
            this.isComposing = false;
        });

        // Keyboard shortcuts
        this.elements.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && !this.isComposing) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });
    }

    /**
     * Handle opening the modal
     * @private
     */
    handleOpenModal() {
        this.elements.modal.classList.add('open');
        this.checkApiKey();
        this.renderer.scrollToBottom();
    }

    /**
     * Handle closing the modal
     * @private
     */
    handleCloseModal() {
        this.elements.modal.classList.remove('open');
    }

    /**
     * Check if API key exists and show appropriate view
     * @private
     */
    checkApiKey() {
        const key = StorageManager.getApiKey();
        if (key) {
            this.uiManager.showChatView();
        } else {
            this.uiManager.showAuthView();
        }
    }

    /**
     * Handle saving API key
     * @private
     */
    handleSaveApiKey() {
        const key = this.elements.apiKeyInput.value.trim();
        if (key) {
            try {
                StorageManager.saveApiKey(key);
                this.checkApiKey();
                this.elements.apiKeyInput.value = '';
                this.uiManager.showToast('API Key 已保存');
            } catch (e) {
                this.uiManager.showToast('保存失败，请重试');
            }
        } else {
            this.uiManager.showToast('请输入有效的 API Key');
        }
    }

    /**
     * Handle clearing API key
     * @private
     */
    handleClearApiKey() {
        this.uiManager.showConfirm(
            '确认移除 API Key？',
            '移除后将无法使用 AI 助手，下次使用需重新输入。',
            () => {
                StorageManager.removeApiKey();
                this.checkApiKey();
                this.uiManager.showToast('API Key 已移除');
            }
        );
    }

    /**
     * Handle clearing chat history
     * @private
     */
    handleClearHistory() {
        this.uiManager.showConfirm(
            '确认清除历史记录？',
            '清除后将无法恢复。',
            () => {
                this.chatHistory = [];
                StorageManager.clearHistory();
                this.renderer.clearAll();
                this.uiManager.showToast('历史记录已清除');
            }
        );
    }

    /**
     * Handle input change
     * @private
     */
    handleInputChange() {
        this.uiManager.updateInputHeight(this.elements.chatInput);
        const hasContent = this.elements.chatInput.value.trim().length > 0;
        this.elements.sendBtn.disabled = !hasContent;
    }

    /**
     * Handle sending a message
     * @private
     */
    async handleSendMessage() {
        const content = this.elements.chatInput.value.trim();
        if (!content) return;

        // Add user message
        this.renderer.renderUserMessage(content);
        this.chatHistory.push({ role: 'user', content });
        StorageManager.saveHistory(this.chatHistory);

        // Reset input
        this.elements.chatInput.value = '';
        this.elements.chatInput.style.height = 'auto';
        this.elements.sendBtn.disabled = true;

        // Show loading
        const loadingId = this.renderer.renderLoading();

        try {
            const apiKey = StorageManager.getApiKey();
            if (!apiKey) {
                throw new Error('No API key found');
            }

            const apiClient = new ChatAPIClient(apiKey);
            const messages = [
                { role: 'system', content: CHAT_CONFIG.API.SYSTEM_PROMPT },
                ...this.chatHistory
            ];

            const reader = await apiClient.sendMessage(messages);

            // Remove loading and create AI message placeholder
            this.renderer.removeMessage(loadingId);
            const aiMessageId = this.renderer.renderAIMessage('');

            // Process stream
            await StreamProcessor.processStream(
                reader,
                (fullResponse) => {
                    // Update message with each chunk
                    this.renderer.updateMessage(aiMessageId, fullResponse);
                    this.renderer.scrollToBottom();
                },
                (fullResponse) => {
                    // Save to history when complete
                    this.chatHistory.push({ role: 'assistant', content: fullResponse });
                    StorageManager.saveHistory(this.chatHistory);
                }
            );

        } catch (error) {
            this.renderer.removeMessage(loadingId);

            const errorMessage = error.message === '401'
                ? '认证失败，API Key 无效。请重新输入。'
                : `出错了: ${error.message}。请检查您的 API Key 是否正确。`;

            this.renderer.renderError(errorMessage);

            if (error.message === '401') {
                StorageManager.removeApiKey();
                this.checkApiKey();
            }
        }
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize chat controller when DOM is ready
 */
function initChatController() {
    new ChatController();
}

// Handle both cases: DOM already loaded or still loading
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatController);
} else {
    // DOM already loaded, initialize immediately
    initChatController();
}
