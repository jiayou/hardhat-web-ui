/**
 * 全局状态管理模块
 * 用于在前端多个路由页面之间共享状态
 */

// 全局状态对象
const globalState = {

  currentSigner: null, // 将会是一个 { address: "0x...", type: "hardhat" 或 "wallet" } 对象
  hardhatAccounts: [],
  


  // 用户设置
  settings: {
    batchSize: 10 // 一次查询请求区块的数量
  }
};

// 初始化全局状态
function initGlobalState() {
  // 从localStorage加载已保存的状态
  try {
    const savedState = localStorage.getItem('hardhat_ui_global_state');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      // 合并已保存的状态到全局状态
      Object.assign(globalState, parsedState);
    }
    
    // 确保从 localStorage 中恢复 currentSigner
    if (!globalState.currentSigner) {
      globalState.currentSigner = localStorage.getItem('currentSigner') || null;
    }
    
    // 初始化设置
    initSettings();
  } catch (error) {
    console.error('加载全局状态时出错:', error);
  }
}

// 保存全局状态到localStorage
function saveGlobalState() {
  try {
    localStorage.setItem('hardhat_ui_global_state', JSON.stringify(globalState));
  } catch (error) {
    console.error('保存全局状态时出错:', error);
  }
}

/**
 * 获取或设置当前signer
 * @param {string|null} newSigner - 新的signer地址
 * @returns {object|null} 当前signer对象
 */
export function currentSigner(newSigner, type) {
  if (newSigner !== undefined) {
    // 如果提供了新的地址，创建一个新的signer对象
    if (newSigner) {
      // 设置新的signer对象
      globalState.currentSigner = {
        address: newSigner,
        type: type || 'hardhat'
      };

      // 同时更新localStorage
      localStorage.setItem('currentSigner', newSigner);
    } else {
      // 如果传入null或undefined，清除当前signer
      globalState.currentSigner = null;
      localStorage.removeItem('currentSigner');
    }

    saveGlobalState();
  }
  return globalState.currentSigner;
}



/**
 * 清空缓存数据
 * @param {string|null} cacheType - 要清空的缓存类型
 */
export function clearCache(cacheType = null) {
  if (cacheType === null) {
    // 清空所有缓存
    globalState.transactionCache = {};
    globalState.blockDetails = {};
    globalState.transactionDetails = {};
    globalState.accountCache = {};
  } else if (cacheType === 'blocks') {
    // 区块缓存已移到 block_list.js
  } else if (cacheType === 'signers') {
    globalState.hardhatAccounts = [];
  }
  
  saveGlobalState();
}

initGlobalState();

// 监听存储事件
window.addEventListener('storage', (event) => {
  if (event.key === 'hardhat_ui_global_state') {
    try {
      if (event.newValue) {
        const newState = JSON.parse(event.newValue);
        Object.assign(globalState, newState);
      }
    } catch (error) {
      console.error('处理存储事件时出错:', error);
    }
  }
});

// 导出全局状态实例
export const debug = {
  getState: () => ({ ...globalState }),
  resetState: () => {
    Object.keys(globalState).forEach(key => {
      if (typeof globalState[key] === 'object' && globalState[key] !== null) {
        globalState[key] = Array.isArray(globalState[key]) ? [] : {};
      } else {
        globalState[key] = null;
      }
    });
    globalState.lastPageState = { blocks: 1, transactions: 1 };
    saveGlobalState();
  }
};

/**
 * 获取批量查询的数量
 * @returns {number} 批量查询的数量
 */
export function getBatchSize() {
  return globalState.settings.batchSize;
}

/**
 * 设置批量查询的数量
 * @param {number} size - 要设置的批量数量
 * @returns {number} 设置后的批量数量
 */
export function setBatchSize(size) {
  if (typeof size === 'number' && size > 0) {
    globalState.settings.batchSize = size;
    saveGlobalState();
    
    // 调用后端API更新批量大小
    fetch(`/api/batch-size/${size}`, { method: 'POST' })
      .then(response => response.json())
      .catch(error => console.error('更新批量大小失败:', error));
  }
  return globalState.settings.batchSize;
}

/**
 * 初始化用户设置
 */
function initSettings() {
  try {
    // 确保settings对象存在
    if (!globalState.settings) {
      globalState.settings = {};
    }
    
    // 确保batchSize有默认值
    if (!globalState.settings.batchSize) {
      globalState.settings.batchSize = 10;
    }
    
    saveGlobalState();
  } catch (error) {
    console.error('初始化设置时出错:', error);
  }
}

/**
 * 初始化设置UI界面
 * 用于设置页面元素的初始值和事件监听
 */
export function initSettingsUI() {
  try {
    // 确保先初始化基础设置
    initSettings();
    
    // 设置批量大小选择器的值
    const batchSizeSelector = document.getElementById('batchSizeSelect');
    if (batchSizeSelector) {
      batchSizeSelector.value = globalState.settings.batchSize;
      
      // 添加事件监听
      batchSizeSelector.addEventListener('change', function() {
        const newSize = parseInt(this.value, 10);
        setBatchSize(newSize);
        
        // 触发自定义事件通知页面刷新
        const event = new CustomEvent('batchSize-changed', { 
          detail: { batchSize: newSize } 
        });
        document.dispatchEvent(event);
      });
    }
    
    // 返回当前的设置对象
    return { ...globalState.settings };
  } catch (error) {
    console.error('初始化设置UI时出错:', error);
    return { batchSize: 10 };
  }
}