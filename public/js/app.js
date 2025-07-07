/**
 * 主应用入口文件
 */

import { fetchNetworkInfo, fetchSigners } from './api.js';
import { showToast } from './utils.js';
import { initSettingsUI } from './state.js';
import { currentSigner, cachedSigners } from './state.js';
// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
  console.time('DOMContentLoaded初始化耗时');
  
  // 初始化全局设置
  console.time('initSettingsUI耗时');
  initSettingsUI();
  console.timeEnd('initSettingsUI耗时');
  
  // 初始化Socket.io连接
  console.time('初始化Socket.io连接耗时');
  const socket = io();
  console.timeEnd('初始化Socket.io连接耗时');
  
  // 初始化网络信息
  console.time('initNetworkInfo耗时');
  initNetworkInfo();
  console.timeEnd('initNetworkInfo耗时');
  
  // 加载签名者列表
  loadSigners();
  
  // 处理实时网络事件
  socket.on('newBlock', (blockData) => {
    console.time('处理newBlock事件耗时');
    showToast('New Block', `Block #${blockData.number} has been mined`);
    updateNetworkInfo();
    console.timeEnd('处理newBlock事件耗时');
  });
  
  socket.on('newTransaction', (txData) => {
    console.time('处理newTransaction事件耗时');
    showToast('New Transaction', `Transaction ${txData.hash.slice(0, 10)}... has been submitted`);
    console.timeEnd('处理newTransaction事件耗时');
  });
  
  console.timeEnd('DOMContentLoaded初始化耗时');
  
  // 使用setTimeout延迟绑定事件
  setTimeout(() => {
    // 绑定Signer选择器事件
    document.getElementById('signerSelect').addEventListener('change', function() {
      currentSigner(this.value);
    });
    
    // 绑定刷新按钮事件
    document.getElementById('refreshSigners').addEventListener('click', function() {
      loadSigners();
    });
  }, 0);
});
/**
 * 初始化网络信息
 */
async function initNetworkInfo() {
  try {
    const data = await fetchNetworkInfo();
    if (data && data.network) {
      document.getElementById('networkName').textContent = data.network.name || 'Unknown';
      document.getElementById('chainId').textContent = data.network.chainId || '-';
    }
  } catch (error) {
    console.error('Error fetching network info:', error);
  }
}

/**
 * 更新网络信息
 */
async function updateNetworkInfo() {
  try {
    const data = await fetchNetworkInfo();
    if (data && data.network) {
      document.getElementById('networkName').textContent = data.network.name || 'Unknown';
      document.getElementById('chainId').textContent = data.network.chainId || '-';
    }
  } catch (error) {
    console.error('Error updating network info:', error);
  }
}

/**
 * 加载签名者列表
 */
async function loadSigners() {
  try {
    // 获取当前选中的signer
    const selectedSigner = currentSigner();
    
    // 如果有缓存先用缓存填充
    if (cachedSigners().length > 0) {
      renderSignerOptions(document.getElementById('signerSelect'), cachedSigners(), selectedSigner);
    }
    
    // 获取最新的signers数据
    const signers = await fetchSigners();
    
    // 更新缓存
    cachedSigners(signers);
    
    // 如果没有选中的签名者且签名者列表不为空，选择第一个
    if (signers.length > 0 && !currentSigner()) {
      currentSigner(signers[0]);
    }
    
    // 渲染签名者选项
    renderSignerOptions(document.getElementById('signerSelect'), signers, currentSigner());
  } catch (error) {
    console.error('Error loading signers:', error);
  }
}

/**
 * 渲染签名者选项到下拉菜单
 */
function renderSignerOptions(selectElement, signers, selectedSigner) {
  const signerSelect = selectElement || document.getElementById('signerSelect');
  signerSelect.innerHTML = '';
  
  // 添加默认选项
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '-- Select a signer --';
  defaultOption.disabled = true;
  defaultOption.selected = !selectedSigner;
  signerSelect.appendChild(defaultOption);
  
  signers.forEach(signer => {
    const option = document.createElement('option');
    const signerAddress = typeof signer === 'string' ? signer : signer.address;
    option.value = signerAddress;
    option.textContent = typeof signer === 'string' ? signerAddress.slice(0, 10) + '...' : (signer.name || signerAddress.slice(0, 10) + '...');
    
    if (selectedSigner && signerAddress === (typeof selectedSigner === 'string' ? selectedSigner : selectedSigner.address)) {
      option.selected = true;
    }
    
    signerSelect.appendChild(option);
  });
}