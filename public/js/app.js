/**
 * 主应用入口文件
 */

import { fetchNetworkInfo } from './api.js';
import { showToast } from './utils.js';
import { initSettings } from './settings.js';
// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
  console.time('DOMContentLoaded初始化耗时');
  
  // 初始化全局设置
  console.time('initSettings耗时');
  initSettings();
  console.timeEnd('initSettings耗时');
  
  // 初始化Socket.io连接
  console.time('初始化Socket.io连接耗时');
  const socket = io();
  console.timeEnd('初始化Socket.io连接耗时');
  
  // 初始化网络信息
  console.time('initNetworkInfo耗时');
  initNetworkInfo();
  console.timeEnd('initNetworkInfo耗时');
  
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