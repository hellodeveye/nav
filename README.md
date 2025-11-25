# 网站导航系统

一个简洁美观的网站导航系统，使用HTML、CSS和JavaScript构建。支持分类展示网站链接，提供深色模式切换，并使用网站自己的favicon作为图标。

```bash
python3 -m http.server 8000
```

## 特点

- 响应式设计，适配各种设备
- 分类展示网站链接
- 自动获取网站自己的favicon作为图标
- 深色模式支持，可根据系统偏好自动切换
- 简单易用的配置方式
- 美观的UI设计
- 搜索功能，快速查找网站
- 访问计数统计

## 使用方法

1. 克隆或下载本仓库
2. 打开 `index.html` 文件即可使用

## 自定义配置

所有网站链接和分类都在 `default.json` (默认导航) 或 `project.json` (项目导航) 文件中配置。全局设置（如标题、副标题）在 `config.json` 中配置。

### 配置说明

```javascript
const CONFIG = {
    // 网站基本设置
    settings: {
        // 网站标题
        title: '网站导航',
        // 网站副标题
        subtitle: '一站式访问您常用的网站',
        // 代码仓库链接
        repositoryUrl: 'https://github.com/your-username/website-navigation'
    },
    
    // 网站分类和链接
    categories: [
        {
            name: '分类名称',
            icon: '分类图标',
            sites: [
                {
                    name: '网站名称',
                    url: '网站地址',
                    description: '网站描述（可选）',
                    // 默认使用网站的favicon
                },
                {
                    name: '使用Phosphor图标',
                    url: '网站地址',
                    description: '网站描述（可选）',
                    useFavicon: false,
                    icon: '图标名称'
                },
                // 更多网站...
            ]
        },
        // 更多分类...
    ]
};
```

### 图标说明

本项目支持两种图标模式：

1. **自动获取网站favicon**（默认模式）
   - 系统会自动从网站获取favicon作为图标
   - 无需额外配置，只需提供网站URL

2. **使用Phosphor Icons**
   - 如果您想使用Phosphor图标而不是网站favicon，设置 `useFavicon: false` 并指定 `icon` 属性
   - 您可以在 [Phosphor Icons 官网](https://phosphoricons.com/) 查找可用的图标名称

示例：
```javascript
// 使用网站favicon（默认）
{
    name: '百度',
    url: 'https://www.baidu.com',
    description: '全球最大的中文搜索引擎'
}

// 使用Phosphor图标
{
    name: '自定义图标',
    url: 'https://example.com',
    description: '示例网站',
    useFavicon: false,
    icon: 'star'
}
```

## 功能说明

### 深色模式

网站支持深色模式，可以通过以下方式切换：

1. 点击顶部栏的主题切换按钮
2. 系统偏好设置（如果您的系统设置为深色模式，网站会自动切换）

用户的主题偏好会保存在本地存储中，下次访问时自动应用。

### 搜索功能

顶部搜索框可以快速查找网站，支持按网站名称和描述搜索。

### GitLab链接

顶部栏的GitLab图标链接到代码仓库，可以在配置文件中设置仓库URL。

### 访问计数

网站会记录访问次数，并显示在顶部栏。

## 文件结构

```
├── index.html          # 主HTML文件
├── css/
│   └── style.css       # 样式文件
├── js/
│   └── main.js         # 主脚本文件
├── img/
│   └── favicon.ico     # 网站favicon图标
├── config.json         # 全局配置和导航列表
├── default.json        # 默认导航分类配置
├── project.json        # 项目导航分类配置
└── README.md           # 说明文档
```

## 许可证

MIT 