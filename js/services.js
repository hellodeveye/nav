/**
 * 服务注册表脚本 - 与主导航风格统一
 */

// 全局数据
let SERVICES_DATA = null;
let currentSearchTerm = '';


/**
 * 页面初始化
 */
document.addEventListener('DOMContentLoaded', async function () {
    try {
        initTheme();
        document.getElementById('current-year').textContent = new Date().getFullYear();
        await loadServices();
        initSearch();
        initSidebarFilters();
    } catch (error) {
        console.error('初始化失败:', error);
        showEmptyState();
    }
});

/**
 * 初始化主题
 */
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle-services');
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        if (prefersDark.matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

/**
 * 加载服务数据
 */
async function loadServices() {
    const response = await fetch('services.json');
    if (!response.ok) throw new Error('Failed to load services.json');
    SERVICES_DATA = await response.json();
    renderServices();
}

/**
 * 渲染服务列表 - 按分类展示
 */
function renderServices() {
    const container = document.getElementById('services-content');
    const emptyState = document.getElementById('empty-state');

    container.innerHTML = '';
    let hasVisibleServices = false;

    SERVICES_DATA.categories.forEach(category => {
        // 应用搜索筛选
        const filteredServices = category.services.filter(service => {
            if (!currentSearchTerm) return true;

            const searchFields = [
                service.name,
                service.content,
                service.description || ''
            ].map(s => s.toLowerCase());
            const term = currentSearchTerm.toLowerCase();
            return searchFields.some(field => field.includes(term));
        });

        if (filteredServices.length === 0) return;

        hasVisibleServices = true;

        const categoryEl = document.createElement('div');
        categoryEl.className = 'category-section';
        categoryEl.id = `category-${category.name}`;

        categoryEl.innerHTML = `
            <h2 class="category-title">
                <i class="ph-fill ph-${category.icon || 'folder'}"></i>
                ${category.name}
            </h2>
            <div class="site-grid">
                ${filteredServices.map(service => createServiceCard(service)).join('')}
            </div>
        `;

        container.appendChild(categoryEl);
    });

    // 绑定卡片点击事件
    container.querySelectorAll('.service-code-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // 如果有选中文本，不触发复制
            if (window.getSelection().toString().length > 0) return;

            const content = card.dataset.content;
            copyToClipboard(content, card);
        });
    });

    emptyState.style.display = hasVisibleServices ? 'none' : 'flex';
}

/**
 * 创建服务卡片 - 代码块风格
 */
function createServiceCard(service) {
    const content = service.content;
    const lineCount = content.split('\n').length;
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');

    return `
        <div class="service-code-card" data-content="${content.replace(/"/g, '&quot;')}">
            <div class="card-header">
                <div class="service-name">${service.name}</div>
            </div>
            <div class="code-block-wrapper">
                <div class="line-numbers">${lineNumbers}</div>
                <pre class="service-content">${escapeHtml(content)}</pre>
            </div>
            <div class="copied-tip">已复制</div>
        </div>
    `;
}

/**
 * HTML转义
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 初始化搜索
 */
function initSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        currentSearchTerm = e.target.value.trim();
        renderServices();
    });
}

/**
 * 初始化侧边栏 - 滚动到锚点
 */
function initSidebarFilters() {
    const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(m => m.classList.remove('active'));
            item.classList.add('active');

            const env = item.dataset.env;
            if (env === 'all') {
                // 滚动到顶部
                document.querySelector('.content-area').scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                // 滚动到对应环境区域
                const target = document.getElementById(`env-${env}`);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });
}

/**
 * 复制到剪贴板
 */
async function copyToClipboard(text, cardEl) {
    try {
        await navigator.clipboard.writeText(text);
        // 显示卡片内的已复制提示
        const tip = cardEl.querySelector('.copied-tip');
        tip.classList.add('show');
        setTimeout(() => {
            tip.classList.remove('show');
        }, 1500);
    } catch (err) {
        console.error('复制失败:', err);
    }
}

/**
 * 显示空状态
 */
function showEmptyState() {
    document.getElementById('services-content').innerHTML = '';
    document.getElementById('empty-state').style.display = 'flex';
}
