/**
 * 全局状态管理模块
 * 用于在前端多个路由页面之间共享状态
 */

// 全局状态对象
const globalState = {

  currentSigner: null,
  // 缓存的signer列表
  hardhatAccounts: [],
  // 用户钱包账户列表
  walletAccounts: [],
  // 当前使用的signer类型
  signerType: 'hardhat',
  
  
  // 缓存的区块数据
  blockCache: {
    data: [],
    nextBlock: null, // 下一次加载的起始区块：null表示从最新区块开始；-1表示没有更多数据了。
  },

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
    
    // 确保从localStorage中恢复signer
    if (!globalState.currentSigner) {
      globalState.currentSigner = localStorage.getItem('currentSigner') || null;
    }
    
    // 从localStorage恢复signerType
    if (!globalState.signerType) {
      globalState.signerType = localStorage.getItem('signerType') || 'hardhat';
    }
    
    // 从localStorage恢复walletAccounts
    const savedWalletAccounts = localStorage.getItem('walletAccounts');
    if (savedWalletAccounts && (!globalState.walletAccounts || globalState.walletAccounts.length === 0)) {
      globalState.walletAccounts = JSON.parse(savedWalletAccounts);
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
 * @returns {string|null} 当前signer地址
 */
export function currentSigner(newSigner, type) {
  if (newSigner !== undefined) {
    globalState.currentSigner = newSigner;
    
    // 同时更新localStorage中的currentSigner
    if (newSigner) {
      localStorage.setItem('currentSigner', newSigner);
    } else {
      localStorage.removeItem('currentSigner');
    }
    
    // 如果提供了type，更新signerType
    if (type !== undefined) {
      globalState.signerType = type;
      localStorage.setItem('signerType', type);
    }
    
    saveGlobalState();
  }
  return globalState.currentSigner;
}


// ================================================= 处理区块缓存

export function updateBlockCache(result) {
  if (!globalState.blockCache?.data) {
    globalState.blockCache = result;
  }
  else {
    globalState.blockCache.data = [...globalState.blockCache.data, ...result.data];
    globalState.blockCache.nextBlock = result.nextBlock;
  }
  saveGlobalState();
}

export function getCachedBlocks() {
  return globalState.blockCache?.data || [];
}

export function getNextBlock() {
  return globalState.blockCache?.nextBlock || null;
}


/**
 * 清空缓存数据
 * @param {string|null} cacheType - 要清空的缓存类型
 */
export function clearCache(cacheType = null) {
  if (cacheType === null) {
    // 清空所有缓存
    globalState.blockCache = {};
    globalState.transactionCache = {};
    globalState.blockDetails = {};
    globalState.transactionDetails = {};
    globalState.accountCache = {};
    globalState.哈人的 = [];
    globalState.walletAccounts = [];
    localStorage.removeItem('walletAccounts');
  } else if (cacheType === 'blocks') {
    globalState.blockCache = {};
  } else if (cacheType === 'signers') {
    globalState.hardhatAccounts = [];
  } else if (cacheType === 'wallet') {
    globalState.walletAccounts = [];
    localStorage.removeItem('walletAccounts');
  }
  
  saveGlobalState();
}

// 自动初始化全局状态
/**
 * 获取当前signer类型
 * @returns {string} 当前signer类型
 */
export function getSignerType() {
  return globalState.signerType;
}

/**
 * 获取钱包账户列表
 * @returns {array} 钱包账户列表
 */
export function getWalletAccounts() {
  return globalState.walletAccounts || [];
}

/**
 * 添加新钱包账户
 * @param {string} address - 要添加的钱包地址
 * @returns {array} 更新后的钱包账户列表
 */
export function addWalletAccount(address) {
  if (!address) return globalState.walletAccounts;
  
  // 确保walletAccounts是数组
  if (!Array.isArray(globalState.walletAccounts)) {
    globalState.walletAccounts = [];
  }
  
  // 检查地址是否已存在
  if (!globalState.walletAccounts.includes(address)) {
    globalState.walletAccounts.push(address);
    
    // 保存到localStorage
    localStorage.setItem('walletAccounts', JSON.stringify(globalState.walletAccounts));
    saveGlobalState();
  }
  
  return globalState.walletAccounts;
}

/**
 * 移除钱包账户
 * @param {string} address - 要移除的钱包地址
 * @returns {array} 更新后的钱包账户列表
 */
export function removeWalletAccount(address) {
  if (!address || !Array.isArray(globalState.walletAccounts)) {
    return globalState.walletAccounts || [];
  }
  
  globalState.walletAccounts = globalState.walletAccounts.filter(acc => acc !== address);
  
  // 保存到localStorage
  localStorage.setItem('walletAccounts', JSON.stringify(globalState.walletAccounts));
  saveGlobalState();
  
  return globalState.walletAccounts;
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