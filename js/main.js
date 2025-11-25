/**
 * 网站导航主脚本
 */

// 全局配置对象
let CONFIG = null;

document.addEventListener('DOMContentLoaded', async function () {
    try {
        // 加载配置列表
        await initConfigs();

        // 加载默认或上次选择的配置
        const lastConfig = localStorage.getItem('currentConfig') || 'default.json';
        await loadConfig(lastConfig);

        // 初始化通用功能（只执行一次）
        initTheme();
        initDrawer();
        initSearch();

        // 标记当前选中的配置
        updateActiveConfigUI(lastConfig);
    } catch (error) {
        console.error('Error initializing app:', error);
        alert('Failed to initialize application. Please try again later.');
    }
});

// 全局配置列表
let CONFIG_LIST = [];
// 全局设置
let GLOBAL_SETTINGS = {};

/**
 * 初始化配置列表
 */
async function initConfigs() {
    try {
        const response = await fetch('config.json');
        if (response.ok) {
            const data = await response.json();
            // 兼容旧格式（数组）和新格式（对象）
            if (Array.isArray(data)) {
                CONFIG_LIST = data;
            } else {
                CONFIG_LIST = data.items || [];
                GLOBAL_SETTINGS = data.settings || {};
            }
            renderDrawerConfigs();
        }
    } catch (error) {
        console.error('Error loading config.json:', error);
    }
}

/**
 * 渲染抽屉中的配置列表
 */
function renderDrawerConfigs() {
    const container = document.getElementById('drawer-configs');
    if (!container) return;

    container.innerHTML = '';

    CONFIG_LIST.forEach(config => {
        const item = document.createElement('div');
        item.className = 'drawer-config-item';
        item.dataset.url = config.url;
        item.innerHTML = `
            <i class="ph-fill ph-${config.icon}"></i>
            <span>${config.name}</span>
            <i class="ph-bold ph-check check-icon"></i>
        `;

        item.addEventListener('click', () => {
            switchConfig(config.url);
            // 关闭抽屉
            const drawerContainer = document.querySelector('.drawer-container');
            if (drawerContainer) {
                drawerContainer.classList.remove('open');
            }
        });

        container.appendChild(item);
    });
}

/**
 * 切换配置
 */
async function switchConfig(configUrl) {
    try {
        await loadConfig(configUrl);
        localStorage.setItem('currentConfig', configUrl);
        updateActiveConfigUI(configUrl);

        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Error switching config:', error);
        alert('Failed to switch configuration.');
    }
}

/**
 * 更新选中的配置UI状态
 */
function updateActiveConfigUI(currentUrl) {
    document.querySelectorAll('.drawer-config-item').forEach(item => {
        if (item.dataset.url === currentUrl) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

/**
 * 加载指定配置并渲染应用
 */
async function loadConfig(configUrl) {
    try {
        const response = await fetch(configUrl);
        if (!response.ok) {
            throw new Error(`Failed to load ${configUrl}`);
        }
        const configData = await response.json();

        // 合并全局设置和特定配置
        // 如果特定配置没有settings，使用全局设置
        // 如果特定配置有settings，它会覆盖全局设置（如果需要的话，但用户要求统一维护）
        // 这里我们优先使用全局设置，除非特定配置显式覆盖（虽然用户说统一维护，但保留灵活性更好，或者强制使用全局）
        // 根据用户"这部分在一个地方维护就好了"的要求，我们主要使用全局设置

        CONFIG = {
            ...configData,
            settings: {
                ...GLOBAL_SETTINGS,
                ...(configData.settings || {})
            }
        };

        // 重新渲染应用内容
        renderApp();
    } catch (error) {
        console.error(`Error loading config ${configUrl}:`, error);
        // 如果加载失败且不是默认配置，尝试回退到默认配置
        if (configUrl !== 'default.json') {
            console.log('Falling back to default config');
            await loadConfig('default.json');
        } else {
            throw error;
        }
    }
}

/**
 * 渲染应用核心内容
 */
function renderApp() {
    // 设置网站标题
    setPageTitle();

    // 设置当前年份
    setCurrentYear();

    // 设置访问计数
    setVisitCount();

    // 设置GitLab链接
    setGitLabLink();

    // 初始化导航菜单
    initNavMenu();

    // 生成侧边栏分类
    generateSidebarCategories();

    // 生成所有分类
    generateAllCategories();
}

/**
 * 设置网站标题
 */
function setPageTitle() {
    // 从配置中获取标题
    if (CONFIG.settings?.title) {
        // 设置页面标题
        document.getElementById('page-title').textContent = CONFIG.settings.title;
        document.title = CONFIG.settings.title;

        // 设置侧边栏标题
        document.getElementById('site-title').textContent = CONFIG.settings.title;
    }

    // 从配置中获取副标题
    if (CONFIG.settings?.subtitle) {
        // 设置侧边栏副标题
        document.getElementById('site-subtitle').textContent = CONFIG.settings.subtitle;
    }
}

/**
 * 设置当前年份
 */
function setCurrentYear() {
    const currentYear = new Date().getFullYear();
    document.getElementById('current-year').textContent = currentYear;
}

/**
 * 设置访问计数
 */
function setVisitCount() {
    // 从本地存储获取访问次数
    let visitCount = localStorage.getItem('visitCount') || 0;
    visitCount = parseInt(visitCount) + 1;

    // 更新本地存储
    localStorage.setItem('visitCount', visitCount);

    // 更新显示
    document.getElementById('visit-count').textContent = `工具已被使用 ${visitCount} 次`;
}

/**
 * 初始化主题
 */
function initTheme() {
    // 获取主题切换按钮
    const themeToggle = document.getElementById('theme-toggle');

    // 从本地存储获取主题设置
    const savedTheme = localStorage.getItem('theme');

    // 如果有保存的主题设置，应用它
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        // 如果没有保存的主题设置，检查系统偏好
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        if (prefersDarkScheme.matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
    }

    // 添加主题切换按钮的点击事件
    themeToggle.addEventListener('click', () => {
        // 获取当前主题
        const currentTheme = document.documentElement.getAttribute('data-theme');

        // 切换主题
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        // 应用新主题
        document.documentElement.setAttribute('data-theme', newTheme);

        // 保存主题设置到本地存储
        localStorage.setItem('theme', newTheme);
    });
}

/**
 * 生成侧边栏分类
 */
function generateSidebarCategories() {
    const sidebarContainer = document.getElementById('sidebar-categories');

    // 清空容器
    sidebarContainer.innerHTML = '';

    // 遍历分类
    CONFIG.categories.forEach(category => {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.innerHTML = `
            <i class="ph-fill ph-${category.icon}"></i>
            <span>${category.name}</span>
        `;

        // 添加点击事件，滚动到对应分类
        menuItem.addEventListener('click', () => {
            const categoryElement = document.getElementById(`category-${category.name}`);
            if (categoryElement) {
                scrollToCategory(categoryElement);

                // 移除所有active类
                document.querySelectorAll('.menu-item').forEach(item => {
                    item.classList.remove('active');
                });

                // 添加active类
                menuItem.classList.add('active');
            }
        });

        sidebarContainer.appendChild(menuItem);
    });


}

/**
 * 生成所有分类网站
 */
function generateAllCategories() {
    const allCategoriesContainer = document.getElementById('all-categories');

    // 清空容器
    allCategoriesContainer.innerHTML = '';

    // 遍历分类
    CONFIG.categories.forEach(category => {
        // 创建分类区域
        const categorySection = document.createElement('div');
        categorySection.className = 'section category-section';
        categorySection.id = `category-${category.name}`;

        // 创建分类标题
        const categoryTitle = document.createElement('h2');
        categoryTitle.className = 'category-title';
        categoryTitle.innerHTML = `<i class="ph-fill ph-${category.icon}"></i> ${category.name}`;

        // 创建网站网格
        const siteGrid = document.createElement('div');
        siteGrid.className = 'site-grid';

        // 遍历网站
        category.sites.forEach(site => {
            const siteCard = createSiteCard(site);
            siteGrid.appendChild(siteCard);
        });

        // 组装分类区域
        categorySection.appendChild(categoryTitle);
        categorySection.appendChild(siteGrid);

        // 添加到容器
        allCategoriesContainer.appendChild(categorySection);
    });
}

/**
 * 创建网站卡片
 * @param {Object} site 网站信息
 * @returns {HTMLElement} 网站卡片元素
 */
function createSiteCard(site) {
    const col = document.createElement('div');
    let iconValue = site.icon;
    // 获取网站图标
    let iconHtml = '';
    if (site.useFavicon !== false && !iconValue) {
        // 默认使用favicon
        iconHtml = `<img src="${getFaviconUrl(site.url)}" alt="${site.name}" class="site-favicon">`;
    } else if (iconValue && (iconValue.startsWith('http://') || iconValue.startsWith('https://'))) {
        // 如果icon是URL，使用img标签显示
        iconHtml = `<img src="${iconValue}" alt="${site.name}" class="site-favicon">`;
    } else if (iconValue) {
        // 如果明确指定不使用favicon且提供了图标，则使用Phosphor图标
        iconHtml = `<i class="ph-fill ph-${iconValue}"></i>`;
    } else {
        // 如果既不使用favicon也没有提供图标，使用默认图标
        iconHtml = `<i class="ph-fill ph-globe"></i>`;
    }

    // 创建描述HTML
    let descHtml = '';
    if (site.description) {
        descHtml = `<p class="card-desc">${site.description}</p>`;
    }

    col.innerHTML = `
        <a href="${site.url}" class="site-link" target="_blank">
            <div class="site-card">
                <div class="site-icon">
                    ${iconHtml}
                </div>
                <h5 class="card-title">${site.name}</h5>
                ${descHtml}
            </div>
        </a>
    `;

    return col;
}

/**
 * 初始化搜索功能
 */
function initSearch() {
    const searchInput = document.getElementById('search-input');

    searchInput.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase().trim();

        // 如果搜索词为空，显示所有网站
        if (searchTerm === '') {
            document.querySelectorAll('.site-link').forEach(link => {
                link.parentElement.style.display = 'block';
            });

            document.querySelectorAll('.category-section').forEach(section => {
                section.style.display = 'block';
            });

            return;
        }

        // 遍历所有网站链接
        document.querySelectorAll('.site-link').forEach(link => {
            const siteName = link.querySelector('.card-title').textContent.toLowerCase();
            const siteDesc = link.querySelector('.card-desc')?.textContent.toLowerCase() || '';

            // 如果网站名称或描述包含搜索词，显示该网站
            if (siteName.includes(searchTerm) || siteDesc.includes(searchTerm)) {
                link.parentElement.style.display = 'block';
            } else {
                link.parentElement.style.display = 'none';
            }
        });

        // 隐藏没有匹配结果的分类
        document.querySelectorAll('.category-section').forEach(section => {
            // 查找该分类下所有显示的网站卡片容器
            const visibleSites = Array.from(section.querySelectorAll('.site-link')).filter(link =>
                link.parentElement.style.display !== 'none'
            ).length;

            section.style.display = visibleSites > 0 ? 'block' : 'none';
        });
    });
}

/**
 * 获取网站的favicon URL
 * @param {string} url 网站URL
 * @returns {string} favicon URL
 */
function getFaviconUrl(url) {

    // 解析URL以获取域名、协议和端口
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const protocol = urlObj.protocol;
    const port = urlObj.port ? `:${urlObj.port}` : '';

    // 直接使用网站根目录的favicon.ico，包含端口号（如果有）
    return `${protocol}//${domain}${port}/favicon.ico`;
}

/**
 * 设置GitLab链接
 */
function setGitLabLink() {
    // 获取GitLab链接元素
    const gitlabLink = document.querySelector('.gitlab-link');

    // 如果配置中有仓库URL，则设置链接
    if (CONFIG.settings?.repositoryUrl) {
        gitlabLink.href = CONFIG.settings.repositoryUrl;
    }
}

/**
 * 初始化导航菜单
 */
function initNavMenu() {
    // 获取"全部"菜单项
    const allMenuItem = document.querySelector('.sidebar-menu .menu-item');

    // 添加点击事件
    allMenuItem.addEventListener('click', () => {
        // 显示所有分类
        document.querySelectorAll('.category-section').forEach(section => {
            section.style.display = 'block';
        });

        // 移除所有active类
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });

        // 添加active类
        allMenuItem.classList.add('active');

        // 滚动到顶部
        const contentArea = document.querySelector('.content-area');
        const topBar = document.querySelector('.top-bar');
        const stickyOffset = topBar ? parseInt(getComputedStyle(topBar).top, 10) || 0 : 0;
        const contentPadding = contentArea ? parseInt(getComputedStyle(contentArea).paddingTop, 10) || 0 : 0;
        const totalOffset = (topBar?.offsetHeight || 0) + stickyOffset + contentPadding;
        const contentTop = contentArea ? contentArea.getBoundingClientRect().top + window.scrollY : 0;
        const targetTop = Math.max(0, contentTop - totalOffset - 8);
        window.scrollTo({ top: targetTop, behavior: 'smooth' });
    });


}

/**
 * 带偏移量滚动到分类，避免被顶部栏遮挡
 * @param {HTMLElement} element 目标分类节点
 */
function scrollToCategory(element) {
    const rect = element.getBoundingClientRect();
    const topBar = document.querySelector('.top-bar');
    const contentArea = document.querySelector('.content-area');
    const topBarHeight = topBar?.offsetHeight || 0;
    const stickyOffset = topBar ? parseInt(getComputedStyle(topBar).top, 10) || 0 : 0;
    const contentPadding = contentArea ? parseInt(getComputedStyle(contentArea).paddingTop, 10) || 0 : 0;
    const baseGap = 16;
    const offset = topBarHeight + stickyOffset + contentPadding + baseGap;
    const targetPosition = rect.top + window.scrollY - offset;

    window.scrollTo({
        top: targetPosition < 0 ? 0 : targetPosition,
        behavior: 'smooth'
    });
}



/**
 * 初始化3D抽屉功能
 */
function initDrawer() {
    try {
        const logoToggle = document.getElementById('logo-toggle');
        const drawerContainer = document.querySelector('.drawer-container');
        const mainContent = document.querySelector('.main-content');
        const drawerMenuItems = document.querySelectorAll('.drawer-menu-item');
        const sidebarMenuItems = document.querySelectorAll('.sidebar-menu .menu-item');

        console.log('初始化抽屉功能', {
            logoToggle: !!logoToggle,
            drawerContainer: !!drawerContainer,
            mainContent: !!mainContent,
            menuItems: drawerMenuItems.length,
            sidebarItems: sidebarMenuItems.length
        });

        if (!logoToggle || !drawerContainer || !mainContent) {
            console.error('抽屉初始化失败：找不到必要的DOM元素');
            return;
        }

        // 平滑过渡类
        mainContent.classList.add('drawer-transition');

        // 标记页面已准备好
        document.body.classList.add('drawer-ready');

        // 防止同时执行多个抽屉动画
        let isAnimating = false;

        // 关闭抽屉的函数
        function closeDrawer() {
            if (isAnimating) return;
            isAnimating = true;
            // 移除open类
            drawerContainer.classList.remove('open');
            isAnimating = false;
        }

        // 打开抽屉的函数
        function openDrawer() {
            if (isAnimating) return;
            isAnimating = true;

            drawerContainer.classList.add('open');
            isAnimating = false;
        }

        // 点击Logo切换抽屉状态
        logoToggle.addEventListener('click', (e) => {
            e.preventDefault(); // 防止可能的默认行为

            if (drawerContainer.classList.contains('open')) {
                closeDrawer();
            } else {
                openDrawer();
            }
        });

        // 点击关闭按钮关闭抽屉
        const closeButton = document.querySelector('.drawer-close');
        if (closeButton) {
            closeButton.addEventListener('click', (e) => {
                e.preventDefault();
                closeDrawer();
            });
        }

        // 点击抽屉菜单项的事件
        drawerMenuItems.forEach(item => {
            item.addEventListener('click', () => {
                // 获取菜单项名称
                const menuText = item.querySelector('span').textContent;
                // 先关闭抽屉
                closeDrawer();

                // 延迟执行操作，让抽屉先关闭
                setTimeout(() => {
                    // 根据不同菜单项执行不同操作
                    switch (menuText) {
                        default:
                            console.log('未知菜单项');
                    }
                }, 300);
            });
        });

        // 点击侧边栏菜单项时关闭抽屉
        sidebarMenuItems.forEach(item => {
            item.addEventListener('click', () => {
                if (drawerContainer.classList.contains('open')) {
                    console.log('关闭抽屉（点击了侧边栏菜单）');
                    closeDrawer();
                }
            });
        });

        // 处理ESC按键关闭抽屉
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && drawerContainer.classList.contains('open')) {
                closeDrawer();
            }
        });
    } catch (error) {
        console.error('初始化抽屉功能失败:', error);
    }
}
