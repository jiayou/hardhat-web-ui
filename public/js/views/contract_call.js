/**
 * 合约交互视图模块
 */

import { showToast } from '../utils.js';
import { callContractFunction } from '../api.js';

// 合约实例缓存
const contractInstances = {};

/**
 * 创建函数卡片UI
 * @param {Object} fn - 函数ABI对象
 * @param {number} index - 函数索引
 * @param {boolean} isRead - 是否为读取函数
 * @returns {string} 函数卡片HTML
 */
function createFunctionCard(fn, index, isRead) {
  const id = `${isRead ? 'read' : 'write'}-fn-${index}`;
  const payable = fn.stateMutability === 'payable';

  return `
    <div class="card function-card">
      <div class="card-header bg-light">
        <div class="d-flex justify-content-between align-items-center">
          <span>${fn.name}</span>
          ${payable ? '<span class="badge bg-warning">Payable</span>' : ''}
        </div>
      </div>
      <div class="card-body">
        <form class="function-form" id="form-${id}" data-fn-name="${fn.name}" data-fn-payable="${payable}">
          ${fn.inputs.length > 0 ? fn.inputs.map((input, i) => `
            <div class="function-param">
              <label class="form-label">${input.name || 'param' + i} (${input.type})</label>
              <input type="text" class="form-control function-input" data-type="${input.type}" placeholder="${input.type}">
            </div>
          `).join('') : '<p class="text-muted small mb-3">No parameters required</p>'}

          ${payable ? `
            <div class="function-param">
              <label class="form-label">Value (ETH)</label>
              <input type="text" class="form-control function-value" placeholder="0">
            </div>
          ` : ''}

          <button type="submit" class="btn btn-sm ${isRead ? 'btn-outline-primary' : 'btn-outline-warning'} call-function-btn">
            ${isRead ? '调用' : '发送'}
          </button>

          <div class="function-result mt-3" style="display: none;">
            <div class="d-flex justify-content-between">
              <h6>结果:</h6>
              <button type="button" class="btn-close clear-result-btn" aria-label="Close"></button>
            </div>
            <pre class="mt-2"></pre>
          </div>
        </form>
      </div>
    </div>
  `;
}

/**
 * 加载合约实例
 * @param {string} address - 合约地址
 * @param {Object} contract - 合约对象
 */
export async function loadContractInstance(address, contract) {
  if (!contract || !address) return;

  try {
    // 区分读取和写入函数
    const readFns = contract.abi.filter(item =>
      item.type === 'function' &&
      (item.stateMutability === 'view' || item.stateMutability === 'pure')
    );

    const writeFns = contract.abi.filter(item =>
      item.type === 'function' &&
      item.stateMutability !== 'view' &&
      item.stateMutability !== 'pure'
    );

    // 显示读取函数
    const readFunctions = document.getElementById('readFunctions');
    if (readFns.length > 0) {
      readFunctions.innerHTML = readFns.map((fn, index) => createFunctionCard(fn, index, true)).join('');
    } else {
      readFunctions.innerHTML = '<p class="text-center text-muted">无可用读取函数</p>';
    }

    // 显示写入函数
    const writeFunctions = document.getElementById('writeFunctions');
    if (writeFns.length > 0) {
      writeFunctions.innerHTML = writeFns.map((fn, index) => createFunctionCard(fn, index, false)).join('');
    } else {
      writeFunctions.innerHTML = '<p class="text-center text-muted">无可用写入函数</p>';
    }

    // 保存合约实例
    contractInstances[address] = {
      name: contract.contractName,
      address: address
    };

    // 设置函数调用事件
    document.querySelectorAll('.function-form').forEach(form => {
      form.addEventListener('submit', e => handleFunctionCall(e, contract));
    });

    // 设置清除结果按钮
    document.querySelectorAll('.clear-result-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const resultDiv = this.closest('.function-result');
        resultDiv.style.display = 'none';
        resultDiv.querySelector('pre').textContent = '';
      });
    });
  } catch (error) {
    console.error('Error loading contract instance:', error);
    showToast('Error', 'Failed to load contract instance: ' + error.message);
  }
}

/**
 * 处理函数调用
 * @param {Event} e - 表单提交事件
 * @param {Object} contract - 合约对象
 */
async function handleFunctionCall(e, contract) {
  e.preventDefault();
  const form = e.target;
  const functionName = form.dataset.fnName;
  const isPaayable = form.dataset.fnPayable === 'true';
  const address = document.getElementById('contractAddress').value;

  if (!address || !functionName || !contract) {
    showToast('Error', 'Missing contract address or function name');
    return;
  }

  const args = [];
  const inputs = form.querySelectorAll('.function-input');
  inputs.forEach(input => {
    args.push(input.value.trim());
  });

  const options = {};
  if (isPaayable) {
    const valueInput = form.querySelector('.function-value');
    if (valueInput && valueInput.value.trim()) {
      options.value = valueInput.value.trim();
    }
  }

  const resultElement = form.querySelector('.function-result');
  const resultPre = resultElement.querySelector('pre');

  try {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> 处理中...';

    const data = await callContractFunction(
      address,
      contract.contractName,
      functionName,
      args,
      options
    );

    resultElement.style.display = 'block';

    if (data.success) {
      resultPre.textContent = typeof data.result === 'object' ?
        JSON.stringify(data.result, null, 2) : data.result;
      resultElement.classList.remove('text-danger');
      resultElement.classList.add('text-success');
    } else {
      resultPre.textContent = data.error || '未知错误';
      resultElement.classList.remove('text-success');
      resultElement.classList.add('text-danger');
    }

    if (window.hljs) {
      window.hljs.highlightElement(resultPre);
    }
  } catch (error) {
    console.error('Error calling function:', error);
    resultElement.style.display = 'block';
    resultPre.textContent = error.message;
    resultElement.classList.remove('text-success');
    resultElement.classList.add('text-danger');
  } finally {
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.textContent = submitBtn.classList.contains('btn-outline-primary') ? '调用' : '发送';
  }
}

/**
 * 初始化合约交互视图
 * @param {Object} contract - 当前合约对象
 */
export function initContractCallView(contract) {
  // 绑定加载合约按钮事件
  const loadContractBtn = document.getElementById('loadContractBtn');
  if (loadContractBtn) {
    loadContractBtn.addEventListener('click', () => {
      const address = document.getElementById('contractAddress').value.trim();
      if (address) {
        loadContractInstance(address, contract);
      } else {
        showToast('Error', 'Please enter a contract address');
      }
    });
  }
}

/**
 * 获取缓存的合约实例
 * @returns {Object} 合约实例缓存
 */
export function getContractInstances() {
  return contractInstances;
}
