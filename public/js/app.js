/**
 * 主应用入口文件
 */

import { showToast } from './utils.js';
import { initSettingsUI } from './state.js';
import { openSignerDialog, displayCurrentSigner } from './widgets/signer.js';

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
  
  // 初始化全局设置
  initSettingsUI();
  
  // 初始化Socket.io连接
  const socket = io();
  
  // 初始化网络信息
  initNetworkInfo();
  
  // 显示签名者信息
  displayCurrentSigner();  

  // 处理实时网络事件
  socket.on('newBlock', (blockData) => {
    showToast('New Block', `Block #${blockData.number} has been mined`);
    updateNetworkInfo();
  });
  socket.on('newTransaction', (txData) => {
    showToast('New Transaction', `Transaction ${txData.hash.slice(0, 10)}... has been submitted`);
  });
  
  // 绑定切换Signer按钮事件
  document.getElementById('switchSigner').addEventListener('click', function() {
    openSignerDialog();
  });
});
/**
 * 初始化网络信息
 */
async function initNetworkInfo() {
  try {
    const response = await fetch('/api/network/info');
    const data = await response.json();
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
    const response = await fetch('/api/network/info');
    const data = await response.json();
    if (data && data.network) {
      document.getElementById('networkName').textContent = data.network.name || 'Unknown';
      document.getElementById('chainId').textContent = data.network.chainId || '-';
    }
  } catch (error) {
    console.error('Error updating network info:', error);
  }
}
