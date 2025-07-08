/**
 * 客户端路由处理
 */

/**
 * 路由映射对象，将路径映射到对应的视图处理函数
 */
const routes = {
  '/': { view: () => import('./views/index.js').then(m => m.default) },
  '/block': { 
    view: () => {
      const params = new URLSearchParams(window.location.search);
      if (params.has('hash') || params.has('number')) {
        const blockId = params.has('hash') ? params.get('hash') : params.get('number');
        return import('./views/block_item.js').then(m => {
          const viewFn = m.default;
          // 为确保视图函数接收正确参数，创建一个代理函数
          const proxyFn = (params) => viewFn(blockId);
          // 复制原始视图的init方法到代理函数
          proxyFn.init = viewFn.init;
          return proxyFn;
        });
      } else {
        return import('./views/block_list.js').then(m => m.default);
      }
    }
  },
  '/transaction': { view: () => import('./views/transaction.js').then(m => m.default) },
  '/account': { 
    view: () => {
      const params = new URLSearchParams(window.location.search);
      if (params.has('address')) {
        const address = params.get('address');
        return import('./views/account_item.js').then(m => {
          const viewFn = m.default;
          // 返回一个新函数，确保无论参数如何，都会使用正确的地址
          return (params) => viewFn(address);
        });
      } else {
        return import('./views/account_list.js').then(m => m.default);
      }
    }
  },
  '/contract': { view: () => import('./views/contract.js').then(m => m.default) },
  '/404': { view: () => import('./views/404.js').then(m => m.default) }
};

/**
 * 路由类，处理客户端路由
 */
class Router {
  constructor() {
    this.app = document.getElementById('app');
    this.init();
  }

  /**
   * 初始化路由
   */
  init() {
    // 处理链接点击
    document.addEventListener('click', e => {
      if (e.target.matches('[data-link]')) {
        e.preventDefault();
        this.navigateTo(e.target.href);
      }
    });

    // 处理浏览器前进/后退按钮
    window.addEventListener('popstate', this.render.bind(this));

    // 处理表单提交
    document.addEventListener('submit', e => {
      if (e.target.id === 'searchForm') {
        e.preventDefault();
        const query = document.getElementById('searchInput').value.trim();
        this.handleSearch(query);
      }
    });

    // 初始渲染
    this.render();
  }

  /**
   * 搜索处理
   * @param {string} query - 搜索查询
   */
  handleSearch(query) {
    if (!query) return;

    // 简单判断查询类型
    if (/^0x[a-fA-F0-9]{40}$/.test(query)) {
      // 以太坊地址格式
      this.navigateTo(`/account?address=${query}`);
    } else if (/^0x[a-fA-F0-9]{64}$/.test(query)) {
      // 交易哈希格式
      this.navigateTo(`/transaction?hash=${query}`);
    } else if (/^\d+$/.test(query)) {
      // 区块号格式
      this.navigateTo(`/block?number=${query}`);
    } else {
      alert('Invalid search query. Please enter a valid block number, transaction hash, or address.');
    }
  }

  /**
   * 导航到指定路径
   * @param {string} url - 目标URL
   */
  async navigateTo(url) {
    history.pushState(null, null, url);
    await this.render();
  }

  /**
   * 渲染当前路径对应的视图
   */
  async render() {
    const path = window.location.pathname;
    const route = routes[path] || routes['/404']; // 未找到的路由显示404页面
    const params = new URLSearchParams(window.location.search);

    try {
      // 动态加载对应的视图组件
      const viewFunction = await route.view();
      this.app.innerHTML = '<div class="text-center my-5"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
      
      // 渲染视图
      const html = await viewFunction(Object.fromEntries(params));
      this.app.innerHTML = html;

      // 执行视图相关的初始化脚本
      if (viewFunction.init) {
        if (path === '/account' && params.has('address')) {
          viewFunction.init(params.get('address'));
        } else {
          viewFunction.init(Object.fromEntries(params));
        }
      }
    } catch (error) {
      console.error('Error loading view:', error);
      this.app.innerHTML = `<div class="alert alert-danger m-5" role="alert">Error loading view: ${error.message}</div>`;
    }
  }
}

// 初始化路由
const router = new Router();

// 导出路由实例
export default router;