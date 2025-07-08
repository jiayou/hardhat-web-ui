/**
 * 合约部署视图模块
 */

import { showToast } from '../utils.js';
import { deployContract } from '../api.js';

/**
 * 显示合约部署参数表单
 * @param {Object} contract - 合约对象
 */
export function renderDeployForm(contract) {
  if (!contract) return;

  // 显示构造函数参数
  const constructorParams = document.getElementById('constructorParams');
  const constructor = contract.abi.find(item => item.type === 'constructor');

  if (constructor && constructor.inputs.length > 0) {
    constructorParams.innerHTML = '<h6 class="mb-3">构造函数参数:</h6>' +
      constructor.inputs.map((input, index) => `
        <div class="mb-3">
          <label class="form-label">${input.name || 'param' + index} (${input.type})</label>
          <input type="text" class="form-control constructor-param" data-type="${input.type}" placeholder="Enter ${input.type}">
        </div>
      `).join('');
  } else {
    constructorParams.innerHTML = '<p class="text-muted">无需构造函数参数</p>';
  }

  // 清空部署结果区域
  document.getElementById('deployResult').innerHTML = '';
}

/**
 * 处理合约部署
 * @param {Object} contract - 当前选中的合约对象
 * @param {Function} onDeploySuccess - 部署成功的回调函数
 */
export async function handleDeployContract(contract, onDeploySuccess) {
  if (!contract) return;

  const args = [];
  const constructor = contract.abi.find(item => item.type === 'constructor');

  if (constructor && constructor.inputs.length > 0) {
    const paramInputs = document.querySelectorAll('.constructor-param');
    if (paramInputs.length !== constructor.inputs.length) {
      showToast('Error', 'Invalid constructor parameters');
      return;
    }

    for (let i = 0; i < paramInputs.length; i++) {
      const value = paramInputs[i].value.trim();
      if (!value && !constructor.inputs[i].name.includes('optional')) {
        showToast('Error', `Parameter ${constructor.inputs[i].name || i} is required`);
        return;
      }
      args.push(value);
    }
  }

  try {
    const deployBtn = document.getElementById('deployBtn');
    const deployResult = document.getElementById('deployResult');

    deployBtn.disabled = true;
    deployBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> 部署中...';

    const data = await deployContract(contract.contractName, args);

    if (data.success && data.address) {
      deployResult.innerHTML = `
        <div class="alert alert-success">
          <h5>部署成功!</h5>
          <p>合约地址: <strong>${data.address}</strong></p>
          <button class="btn btn-sm btn-outline-primary copy-btn" data-address="${data.address}">复制地址</button>
        </div>
      `;

      // 设置复制按钮点击事件
      document.querySelector('.copy-btn').addEventListener('click', function() {
        navigator.clipboard.writeText(this.getAttribute('data-address'));
        showToast('Success', '合约地址已复制到剪贴板');
      });

      // 调用部署成功回调
      if (typeof onDeploySuccess === 'function') {
        onDeploySuccess(data.address);
      }
    } else {
      deployResult.innerHTML = `
        <div class="alert alert-danger">
          <h5>部署失败</h5>
          <p>${data.error || '未知错误'}</p>
          ${data.details ? `<pre class="mt-2">${data.details}</pre>` : ''}
        </div>
      `;
    }
  } catch (error) {
    console.error('Error deploying contract:', error);
    document.getElementById('deployResult').innerHTML = `
      <div class="alert alert-danger">
        <h5>部署失败</h5>
        <p>${error.message}</p>
      </div>
    `;
  } finally {
    const deployBtn = document.getElementById('deployBtn');
    deployBtn.disabled = false;
    deployBtn.textContent = '部署合约';
  }
}

/**
 * 初始化合约部署视图
 * @param {Function} deployHandler - 部署处理函数
 */
export function initContractDeployView(deployHandler) {
  // 绑定部署按钮事件
  const deployBtn = document.getElementById('deployBtn');
  if (deployBtn) {
    deployBtn.addEventListener('click', deployHandler);
  }
}
