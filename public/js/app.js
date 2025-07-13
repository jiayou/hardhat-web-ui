/**
 * 主应用入口文件
 */

import { showToast } from './utils.js';
import { currentSigner } from './state.js';
import { openSignerDialog, displayCurrentSigner } from './widgets/signer.js';
import { initI18n, switchLanguage, getCurrentLanguage, supportedLanguages, initMutationObserver, t } from './i18n.js';
// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', async function() {
  
  // 初始化i18n
  await initI18n();
  initMutationObserver();
  initLanguageSelector();
  
  // 初始化Socket.io连接
  const socket = io();
  
  // 延迟执行网络信息和签名者信息的初始化，确保i18n已完全加载
  setTimeout(async () => {
    try {
      // 先获取可用的signer列表
      const signerResponse = await fetch('/api/signer');
      const signers = await signerResponse.json();
      
      // 检查当前是否有signer，如果没有则设置第一个获取到的signer作为默认值
      const currentSignerValue = currentSigner();
      if (!currentSignerValue && signers && signers.length > 0) {
        // 设置第一个signer作为默认值
        const defaultSigner = typeof signers[0] === 'string' ? signers[0] : signers[0].address || signers[0];
        currentSigner(defaultSigner, 'hardhat');
      }
      
      // 直接更新网络信息，避免显示"加载中"状态
      updateNetworkInfo();
      
      // 显示签名者信息
      displayCurrentSigner();
    } catch (error) {
      console.error('Failed to initialize signer:', error);
    }
  }, 500);

  // 处理实时网络事件
  socket.on('newBlock', (blockData) => {
    showToast(t('block.newBlock'), t('block.mined', {number: blockData.number}));
    updateNetworkInfo();
  });
  socket.on('newTransaction', (txData) => {
    showToast(t('transaction.new'), t('transaction.submitted', {hash: txData.hash.slice(0, 10)}));
  });
  
  // 绑定切换Signer按钮事件
  document.getElementById('switchSigner').addEventListener('click', function() {
    openSignerDialog();
  });
});

/**
 * 初始化语言选择器
 */
function initLanguageSelector() {
  // 显示当前语言
  updateCurrentLanguageDisplay();
  
  // 绑定语言切换事件
  document.getElementById('languageSelector').addEventListener('click', function(event) {
    if (event.target.hasAttribute('data-lang')) {
      event.preventDefault();
      const lang = event.target.getAttribute('data-lang');
      switchLanguage(lang);
      updateCurrentLanguageDisplay();
    }
  });
  
  // 语言切换后刷新页面内容
  document.addEventListener('language-changed', function(event) {
    updateCurrentLanguageDisplay();
    // 更新网络信息和Signer信息
    updateNetworkInfo();
    displayCurrentSigner();

    // 重新渲染当前视图以更新所有动态生成的i18n文本
    import('./router.js').then(module => {
      const router = module.default;
      router.render();
    });
  });
}

/**
 * 更新当前语言显示
 */
function updateCurrentLanguageDisplay() {
  const currentLang = getCurrentLanguage();
  const displayElement = document.getElementById('currentLanguage');
  if (displayElement) {
    displayElement.textContent = supportedLanguages[currentLang];
  }
}
/**
 * 初始化网络信息
 */
async function initNetworkInfo() {
  try {
    // 显示加载状态
    document.getElementById('networkName').textContent = t('common.loading');
    document.getElementById('chainId').textContent = t('common.loading');

    const response = await fetch('/api/network/info');
    const data = await response.json();
    if (data && data.network) {
      document.getElementById('networkName').textContent = data.network.name || t('common.unknown');
      document.getElementById('chainId').textContent = data.network.chainId || '-';
    }
  } catch (error) {
    console.error(t('error.networkInfoFailed'), error);
    document.getElementById('networkName').textContent = t('error.failed');
    document.getElementById('chainId').textContent = t('error.failed');
  }
}

/**
 * 更新网络信息
 */
async function updateNetworkInfo() {
  try {
    const response = await fetch('/api/network/info');
    const data = await response.json();
    if (data && data.network) {
      document.getElementById('networkName').textContent = data.network.name || t('common.unknown');
      document.getElementById('chainId').textContent = data.network.chainId || '-';
    }
  } catch (error) {
    console.error(t('error.networkInfoUpdateFailed'), error);
  }
}