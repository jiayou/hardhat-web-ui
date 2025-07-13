/**
 * 合约交互视图模块
 */

import { showToast } from '../utils.js';
import { currentSigner } from '../state.js';
import TransactionConfirm from '../widgets/transaction_confirm.js';
import WaitReceipt from '../widgets/wait_receipt.js';
import { t } from '../i18n.js';

// 合约实例缓存
const contractInstances = {};


/**
 * 调用合约函数
 * @param {string} address - 合约地址
 * @param {string} contractName - 合约名称
 * @param {string} functionName - 函数名称
 * @param {Array} args - 函数参数
 * @param {Object} options - 调用选项（如value等）
 * @returns {Promise} 包含调用结果的Promise
 */
async function callContractFunction(address, contractName, functionName, args, options = {}) {
  try {
    // 获取当前选中的signer
    const signer = currentSigner().address;
    console.log("call contract method with signer:", signer)
    
    const response = await fetch('/api/contract/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contractAddress: address,
        contractName: contractName,
        method: functionName,
        args,
        signer: signer, // 自动附加当前signer
        ...options
      }),
    });
    if (!response.ok) {
      throw new Error(`Network error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(t('contract.failedToCallFunction') + ':', error);
    showToast(t('common.error'), t('contract.failedToCallFunction') + ': ' + error.message);
    throw error;
  }
}


/**
 * 创建函数卡片UI
 * @param {Object} fn - 函数ABI对象
 * @param {number} index - 函数索引
 * @param {boolean} isRead - 是否为读取函数
 * @returns {string} 函数卡片HTML
 */
function renderFunctionCard(fn, index, isRead) {
  const id = `${isRead ? 'read' : 'write'}-fn-${index}`;
  const payable = fn.stateMutability === 'payable';
  const signerType = currentSigner().type;

  // 如果是写入函数且signer类型是wallet，使用红色按钮
  const buttonClass = isRead ? 'btn-outline-primary' : 
                    (signerType === 'wallet' ? 'btn-outline-danger' : 'btn-outline-warning');

  return `
  <div style="padding: 10px;">
    <div class="card function-card">
      <div class="card-header bg-light">
        <div class="d-flex justify-content-between align-items-center">
          <span>${fn.name}</span>
          ${payable ? `<span class="badge bg-warning">${t('contract.payable')}</span>` : ''}
          ${!isRead && signerType === 'wallet' ? `<span class="badge bg-danger">${t('contract.wallet')}</span>` : ''}
        </div>
      </div>
      <div class="card-body">
        <form class="function-form" id="form-${id}" data-fn-name="${fn.name}" data-fn-payable="${payable}">
          ${fn.inputs.length > 0 ? fn.inputs.map((input, i) => `
            <div class="function-param">
              <label class="form-label">${input.name || 'param' + i} (${input.type})</label>
              <input type="text" class="form-control function-input" data-type="${input.type}" placeholder="${t('contract.paramPlaceholder').replace('{type}', input.type)}">
            </div>
          `).join('') : `<p class="text-muted small mb-3">${t('contract.noParams')}</p>`}

          ${payable ? `
            <div class="function-param">
              <label class="form-label">${t('contract.value')}</label>
              <input type="text" class="form-control function-value" placeholder="0">
            </div>
          ` : ''}

          <button type="submit" class="btn btn-sm ${buttonClass} call-function-btn" data-is-read="${isRead}">
            ${isRead ? t('contract.callFunction') : (signerType === 'wallet' ? t('contract.sendWithWallet') : t('contract.sendFunction'))}
          </button>

          <div class="function-result mt-3" style="display: none;">
            <div class="d-flex justify-content-between">
              <h6>${t('contract.result')}</h6>
              <button type="button" class="btn-close clear-result-btn" aria-label="Close"></button>
            </div>
            <pre class="mt-2"></pre>
          </div>
        </form>
      </div>
    </div>
  </div>
  `;
}

/**
 * 加载合约实例
 * @param {string} address - 合约地址
 * @param {Object} contract - 合约对象，如果未提供，将尝试从contract.js获取
 */
export async function loadContractInstance(address, contract) {
  console.log('Loading contract instance:', address)
  // 如果未提供contract参数，尝试从contract.js获取currentContract
  if (!contract) {
    try {
      // 动态导入getCurrentContract以避免循环依赖
      const { getCurrentContract } = await import('./contract.js');
      contract = getCurrentContract();
    } catch (error) {
      console.error('Error getting current contract:', error);
    }
    
    if (!contract) {
      showToast(t('common.error'), t('contract.invalidParams'));
      return;
    }
  }
  if (!address) {
    showToast(t('common.error'), t('contract.missingAddressOrFunction'));
    return;
  }

  // 更新URL，添加address参数
  const url = new URL(window.location);
  url.searchParams.set('address', address);
  window.history.pushState({}, '', url);

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
      readFunctions.innerHTML = readFns.map((fn, index) => renderFunctionCard(fn, index, true)).join('');
    } else {
      readFunctions.innerHTML = `<p class="text-center text-muted">${t('contract.noReadFunctions')}</p>`;
    }

    // 显示写入函数
    const writeFunctions = document.getElementById('writeFunctions');
    if (writeFns.length > 0) {
      writeFunctions.innerHTML = writeFns.map((fn, index) => renderFunctionCard(fn, index, false)).join('');
    } else {
      writeFunctions.innerHTML = `<p class="text-center text-muted">${t('contract.noWriteFunctions')}</p>`;
    }

    // 保存合约实例
    contractInstances[address] = {
      name: contract.contractName,
      address: address
    };

    // 设置函数调用事件
    document.querySelectorAll('.function-form').forEach(form => {
      const isRead = form.querySelector('button[type="submit"]').dataset.isRead === "true";
      const signerType = currentSigner().type;

      // 根据函数类型和signer类型选择合适的处理函数
      if (isRead) {
        form.addEventListener('submit', e => readonlyCall(e, contract));
      } else if (signerType === 'wallet') {
        form.addEventListener('submit', e => walletCall(e, contract));
      } else {
        form.addEventListener('submit', e => writeCall(e, contract));
      }
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
    console.error(t('contract.failedToLoad') + ':', error);
    showToast(t('common.error'), t('contract.failedToLoad') + ': ' + error.message);
  }
}

/**
 * 处理函数调用
 * @param {Event} e - 表单提交事件
 * @param {Object} contract - 合约对象
 */
/**
 * 处理只读函数调用
 * @param {Event} e - 表单提交事件
 * @param {Object} contract - 合约对象
 */
async function readonlyCall(e, contract) {
  e.preventDefault();
  const form = e.target;
  const functionName = form.dataset.fnName;
  const address = document.getElementById('contractAddress').value;
  
  if (!address || !functionName || !contract) {
    showToast(t('common.error'), t('contract.missingAddressOrFunction'));
    return;
  }

  const args = [];
  const inputs = form.querySelectorAll('.function-input');
  inputs.forEach(input => {
    args.push(input.value.trim());
  });

  const options = {};
  const resultElement = form.querySelector('.function-result');
  const resultPre = resultElement.querySelector('pre');

  try {
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> ${t('contract.processing')}`;

    // 调用合约函数
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
      resultPre.textContent = data.error || t('contract.unknownError');
      resultElement.classList.remove('text-success');
      resultElement.classList.add('text-danger');
    }
  } catch (error) {
    console.error(t('contract.failedToCallFunction') + ':', error);
    resultElement.style.display = 'block';
    resultPre.textContent = error.message;
    resultElement.classList.remove('text-success');
    resultElement.classList.add('text-danger');
  } finally {
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.textContent = t('contract.callFunction');
  }
}

/**
 * 处理常规写入函数调用
 * @param {Event} e - 表单提交事件
 * @param {Object} contract - 合约对象
 */
async function writeCall(e, contract) {
  e.preventDefault();
  const form = e.target;
  const functionName = form.dataset.fnName;
  const isPayable = form.dataset.fnPayable === 'true';
  const address = document.getElementById('contractAddress').value;
  
  if (!address || !functionName || !contract) {
    showToast(t('common.error'), t('contract.missingAddressOrFunction'));
    return;
  }

  const args = [];
  const inputs = form.querySelectorAll('.function-input');
  inputs.forEach(input => {
    args.push(input.value.trim());
  });

  const options = {};
  if (isPayable) {
    const valueInput = form.querySelector('.function-value');
    if (valueInput && valueInput.value.trim()) {
      options.value = valueInput.value.trim();
    }
  }

  const resultElement = form.querySelector('.function-result');
  const resultPre = resultElement.querySelector('pre');

  try {
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> ${t('contract.processing')}`;

    // 调用合约函数
    callContractFunction(
      address,
      contract.contractName,
      functionName,
      args,
      options
    )
    .then( data => {
      console.log(data)
      WaitReceipt.show(data.txHash)
      resultElement.style.display = 'block';
  
      if (data.success) {
        resultPre.textContent = typeof data.result === 'object' ?
          JSON.stringify(data.result, null, 2) : data.result;
        resultElement.classList.remove('text-danger');
        resultElement.classList.add('text-success');
      } else {
        resultPre.textContent = data.error || t('contract.unknownError');
        resultElement.classList.remove('text-success');
        resultElement.classList.add('text-danger');
      }
    });

  } catch (error) {
    console.error(t('contract.failedToCallFunction') + ':', error);
    resultElement.style.display = 'block';
    resultPre.textContent = error.message;
    resultElement.classList.remove('text-success');
    resultElement.classList.add('text-danger');
  } finally {
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.textContent = t('contract.sendFunction');
  }
}

/**
 * 处理需要钱包交互的函数调用
 * @param {Event} e - 表单提交事件
 * @param {Object} contract - 合约对象
 */
async function walletCall(e, contract) {
  e.preventDefault();
  const form = e.target;
  const functionName = form.dataset.fnName;
  const isPayable = form.dataset.fnPayable === 'true';
  const address = document.getElementById('contractAddress').value;
  const signer = currentSigner();

  // 通过MetaMask发送交易
  if (!window.ethereum) {
    // TODO:WALLET
    // throw new Error('MetaMask或其他兼容钱包未安装');
  }

  if (!address || !functionName || !contract) {
    showToast(t('common.error'), t('contract.missingAddressOrFunction'));
    return;
  }

  const args = [];
  const inputs = form.querySelectorAll('.function-input');
  inputs.forEach(input => {
    args.push(input.value.trim());
  });

  const options = {};
  if (isPayable) {
    const valueInput = form.querySelector('.function-value');
    if (valueInput && valueInput.value.trim()) {
      options.value = valueInput.value.trim();
    }
  }

  const resultElement = form.querySelector('.function-result');
  const resultPre = resultElement.querySelector('pre');

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> ${t('contract.processing')}`;

  // 准备调用合约的交易数据
  const contractABI = contract.abi;
  const functionABI = contractABI.find(item => item.name === functionName);
  
  // 调用prepare-call API处理编码和准备交易
  fetch('/api/contract/prepare-call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: signer.address,
      to: address,
      contractABI,
      functionName,
      args,
      value: options.value ? options.value : undefined
    })
  })
  .then(response => {
    if (!response.ok) {
      console.error(response.statusText);
      throw new Error(`${t('contract.failedToPrepareTransaction')}: ${response.statusText}`);
    }
    
    response.json().then(data => {
      // 显示转账确认框
      console.log("prepare-transfer response: ", data);
      TransactionConfirm.show(data.txData);

    })
    
  })
  .catch (error => {
    console.error(t('contract.failedToCallFunction') + ':', error);
    resultElement.style.display = 'block';
    resultPre.textContent = error.message;
    resultElement.classList.remove('text-success');
    resultElement.classList.add('text-danger');
  }) 
  .finally(()=>{
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.textContent = t('contract.sendWithWallet');
  });

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
        showToast(t('common.error'), t('contract.enterContractAddress'));
      }
    });
  }
  
  // 从URL参数中获取address并自动填充
  const urlParams = new URLSearchParams(window.location.search);
  const addressParam = urlParams.get('address');
  if (addressParam) {
    const addressInput = document.getElementById('contractAddress');
    if (addressInput) {
      addressInput.value = addressParam;
      // 自动加载合约实例
      loadContractInstance(addressParam, contract);
    }
  }
}

/**
 * 渲染合约交互界面
 * @returns {string} 合约交互HTML元素
 */
export function renderContractCall() {
  return `
    <div class="card">
      <div class="card-header">
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="mb-0">${t('contract.interaction')}</h5>
        </div>
      </div>
      <div class="card-body">
        <div class="mb-3">
          <label for="contractAddress" class="form-label">${t('contract.address')}</label>
          <div class="input-group">
            <input type="text" class="form-control" id="contractAddress" placeholder="${t('contract.inputAddress')}">
            <button class="btn btn-primary" id="loadContractBtn">${t('contract.loadContract')}</button>
          </div>
        </div>

        <div class="row">
          <div class="col-md-6" style="padding: 10px;">
            <div class="card">
              <h5>${t('contract.readFunctions')}</h5>
              <div id="readFunctions">
                <p class="text-center text-muted">${t('contract.pleaseLoadContract')}</p>
              </div>
            </div>
          </div>
          <div class="col-md-6" style="padding: 10px;">
            <div class="card">
              <h5>${t('contract.writeFunctions')}</h5>
              <div id="writeFunctions">
                <p class="text-center text-muted">${t('contract.pleaseLoadContract')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}