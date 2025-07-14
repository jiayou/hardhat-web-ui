// Signer组件初始化
import { openSignerDialog, displayCurrentSigner } from './widgets/signer.js';

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
  // 初始化Signer相关事件
  initSignerEvents();
});

/**
 * 初始化Signer相关事件
 */
function initSignerEvents() {
  // 为 switchSigner 按钮添加点击事件
  document.getElementById('switchSigner')?.addEventListener('click', openSignerDialog);

  // 为小屏幕上的用户图标按钮添加点击事件
  document.getElementById('signerIconBtn')?.addEventListener('click', openSignerDialog);

  // 初始显示当前Signer
  displayCurrentSigner();
}
