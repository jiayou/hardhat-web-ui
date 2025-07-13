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

export function longerAddress(address) {
  if (!address) return '';
  return address;
}

/**
 * 格式化以太币数量为可读形式
 * @param {string} wei - 以Wei为单位的数量
 * @returns {string} - 格式化后的以太币数量
 */
export function formatEther(wei) {
  // 使用BigInt处理大数，避免精度丢失
  if (!wei) return '0 ETH';
  const ether = BigInt(wei) / BigInt(1e18);
  const remainder = BigInt(wei) % BigInt(1e18);
  const decimalPart = remainder.toString().padStart(18, '0').slice(0, 6);
  return `${ether}.${decimalPart} ETH`;
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>} - 复制成功返回true，失败返回false
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('成功', '已复制到剪贴板');
    return true;
  } catch (err) {
    console.error('复制到剪贴板失败:', err);
    showToast('错误', '复制到剪贴板失败');
    return false;
  }
}
