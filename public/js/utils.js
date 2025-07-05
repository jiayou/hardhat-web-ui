/**
 * 工具函数集合
 */

/**
 * 显示Toast消息
 * @param {string} title - 消息标题
 * @param {string} message - 消息内容
 */
export function showToast(title, message) {
  const toastEl = document.getElementById('toast');
  const toastTitle = document.getElementById('toastTitle');
  const toastMessage = document.getElementById('toastMessage');
  
  toastTitle.textContent = title;
  toastMessage.textContent = message;
  
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}

/**
 * 格式化日期时间
 * @param {number} timestamp - Unix时间戳
 * @returns {string} - 格式化的日期时间
 */
export function formatDateTime(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

/**
 * 简化地址显示, 只显示开头和结尾
 * @param {string} address - 完整地址
 * @returns {string} - 简化后的地址
 */
export function shortenAddress(address) {
  if (!address) return '';
  return address.slice(0, 6) + '...' + address.slice(-4);
}

/**
 * 格式化以太币数量为可读形式
 * @param {string} wei - 以Wei为单位的数量
 * @returns {string} - 格式化后的以太币数量
 */
export function formatEther(wei) {
  // 简单格式化, 未考虑大数处理
  const ether = parseInt(wei) / 1e18;
  return ether.toFixed(6) + ' ETH';
}
