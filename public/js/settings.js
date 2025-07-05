/**
 * 全局设置管理模块
 * 处理全局UI设置和用户偏好
 */

// 默认设置
const DEFAULT_SETTINGS = {
  pageSize: 10
};

// 从localStorage加载设置，如果不存在则使用默认值
let settings = loadSettings();

/**
 * 从localStorage加载设置
 * @returns {Object} 设置对象
 */
function loadSettings() {
  try {
    const savedSettings = localStorage.getItem('hardhat_ui_settings');
    return savedSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) } : { ...DEFAULT_SETTINGS };
  } catch (error) {
    console.error('加载设置时出错:', error);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * 保存设置到localStorage
 */
function saveSettings() {
  try {
    localStorage.setItem('hardhat_ui_settings', JSON.stringify(settings));
  } catch (error) {
    console.error('保存设置时出错:', error);
  }
}

/**
 * 获取当前页面大小设置
 * @returns {number} 当前设置的页面大小
 */
export function getPageSize() {
  return settings.pageSize;
}

/**
 * 设置页面大小
 * @param {number} size - 页面大小
 */
export function setPageSize(size) {
  settings.pageSize = parseInt(size, 10) || DEFAULT_SETTINGS.pageSize;
  saveSettings();
}

/**
 * 初始化设置控件
 */
export function initSettings() {
  // 初始化页面大小选择器
  const pageSizeSelect = document.getElementById('pageSizeSelect');
  if (pageSizeSelect) {
    // 设置初始值
    pageSizeSelect.value = settings.pageSize.toString();

    // 添加变更事件监听器
    pageSizeSelect.addEventListener('change', function() {
      const newPageSize = parseInt(this.value, 10);
      setPageSize(newPageSize);

      // 触发自定义事件，通知其他组件页面大小已变更
      const event = new CustomEvent('pageSizeChanged', { 
        detail: { pageSize: newPageSize } 
      });
      document.dispatchEvent(event);
    });
  }
}
