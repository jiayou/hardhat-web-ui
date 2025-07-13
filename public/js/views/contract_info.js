/**
 * 合约信息视图模块
 */
import { t } from '../i18n.js';

/**
 * 渲染合约信息视图
 * @returns {string} HTML内容
 */
export function renderContractInfo() {
  return `
    <div class="row">
      <div class="col-md-6">
        <h5>${t('contract.information')}</h5>
        <table class="table">
          <tbody id="contractDetails-info"></tbody>
        </table>

        <h5 class="mt-4">${t('contract.bytecodeDetail')}</h5>
        <div class="bytecode-container">
          <textarea id="contractBytecode" class="form-control" readonly style="font-family: monospace; font-size: 0.85rem; height: 150px;"></textarea>
        </div>
      </div>
      <div class="col-md-6">
        <h5>${t('contract.abi')}</h5>
        <div class="abi-container">
          <textarea id="contractAbi" class="form-control" readonly style="font-family: monospace; font-size: 0.85rem; height: 150px;"></textarea>
        </div>
      </div>
    </div>
  `;
}

/**
 * 显示合约详细信息
 * @param {Object} contract - 合约对象
 * @param {string} contractName - 合约名称
 */
export function updateContractInfoContent(contract, contractName) {
  if (!contract) return;

  // 显示ABI
  document.getElementById('contractAbi').textContent = JSON.stringify(contract.abi, null, 2);
  // 显示字节码
  document.getElementById('contractBytecode').textContent = contract.bytecode;

  // 调整视图高度
  adjustTextareaHeights();

  // 显示合约信息
  const info = [
    [t('contract.name'), contractName],
    [t('contract.bytecodeSize'), (contract.bytecode.length / 2 - 1) + ' ' + t('contract.bytes')],
    [t('contract.functions'), contract.abi.filter(item => item.type === 'function').length],
    [t('contract.events'), contract.abi.filter(item => item.type === 'event').length],
  ];

  document.getElementById('contractDetails-info').innerHTML = info.map(([key, value]) =>
    `<tr><th>${key}</th><td>${value}</td></tr>`
  ).join('');
}

/**
 * 调整文本区域高度
 */
export function adjustTextareaHeights() {
  // 根据窗口大小计算textarea高度
  function adjustByteCodeHeight() {
    const windowHeight = window.innerHeight;
    const bytecodeTextarea = document.getElementById('contractBytecode');
    if (bytecodeTextarea) {
      // 计算高度为窗口高度的30%，最小100px
      const newHeight = Math.max(Math.floor(windowHeight * 0.4), 100);
      bytecodeTextarea.style.height = newHeight + 'px';
    }
  }

  // 初次调整高度
  adjustByteCodeHeight();

  // 根据窗口大小计算ABI textarea高度
  function adjustAbiHeight() {
    const windowHeight = window.innerHeight;
    const abiTextarea = document.getElementById('contractAbi');
    if (abiTextarea) {
      // 计算高度为窗口高度的70%，最小150px
      const newHeight = Math.max(Math.floor(windowHeight * 0.65), 150);
      abiTextarea.style.height = newHeight + 'px';
    }
  }

  // 初次调整ABI高度
  adjustAbiHeight();

  // 监听窗口大小变化，同时更新高度
  window.removeEventListener('resize', adjustByteCodeHeight);
  window.addEventListener('resize', function() {
    adjustByteCodeHeight();
    adjustAbiHeight();
  });
}

/**
 * 初始化合约信息视图
 */
export function initContractInfoView() {
  // 可以添加合约信息视图的特定初始化逻辑
}