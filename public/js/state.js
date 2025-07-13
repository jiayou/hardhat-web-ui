/**
 * 全局状态管理模块
 * 用于在前端多个路由页面之间共享状态
 */

// 全局状态对象
const globalState = {

  currentSigner: null, // 将会是一个 { address: "0x...", type: "hardhat" 或 "wallet" } 对象
  hardhatAccounts: [],
  isLiveNetwork: true, // 公链RPC性能限制
};

// 初始化全局状态
async function initGlobalState() {
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

    globalState.isLiveNetwork = true

  } catch (error) {
    console.error('初始化全局状态时出错:', error);
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


export function isLiveNetwork() {
  return globalState.isLiveNetwork
}


await initGlobalState();

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

