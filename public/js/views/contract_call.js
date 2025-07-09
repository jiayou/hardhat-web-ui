/**
 * 合约交互视图模块
 */

import { showToast } from '../utils.js';
import { currentSigner } from '../state.js';

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
    console.error('Error calling contract function:', error);
    showToast('Error', 'Failed to call contract function: ' + error.message);
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
function createFunctionCard(fn, index, isRead) {
  const id = `${isRead ? 'read' : 'write'}-fn-${index}`;
  const payable = fn.stateMutability === 'payable';
  const signerType = currentSigner().type;

  // 如果是写入函数且signer类型是wallet，使用红色按钮
  const buttonClass = isRead ? 'btn-outline-primary' : 
                    (signerType === 'wallet' ? 'btn-outline-danger' : 'btn-outline-warning');

  return `
    <div class="card function-card">
      <div class="card-header bg-light">
        <div class="d-flex justify-content-between align-items-center">
          <span>${fn.name}</span>
          ${payable ? '<span class="badge bg-warning">Payable</span>' : ''}
          ${!isRead && signerType === 'wallet' ? '<span class="badge bg-danger">Wallet</span>' : ''}
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

          <button type="submit" class="btn btn-sm ${buttonClass} call-function-btn" data-is-read="${isRead}">
            ${isRead ? '调用' : (signerType === 'wallet' ? '使用钱包发送' : '发送')}
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
  const isRead = form.querySelector('button[type="submit"]').dataset.isRead === "true";
  const signer = currentSigner();

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

    // 如果不是读取函数且使用的是钱包类型的签名者
    if (!isRead && signer.type === 'wallet') {
      // 准备调用合约的交易数据
      const contractABI = contract.abi;
      const functionABI = contractABI.find(item => item.name === functionName);
      
      // 调用prepare-call API处理编码和准备交易
      const response = await fetch('/api/contract/prepare-call', {
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
      });
      
      if (!response.ok) {
        throw new Error(`Failed to prepare transaction: ${response.statusText}`);
      }
      
      const prepareData = await response.json();
      
      // 通过MetaMask发送交易
      if (!window.ethereum) {
        throw new Error('MetaMask或其他兼容钱包未安装');
      }
      
      try {
        // 发送交易
        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [prepareData.txData],
        });
        
        resultElement.style.display = 'block';
        resultPre.textContent = `交易已提交，交易哈希: ${txHash}\n请等待交易确认。`;
        resultElement.classList.remove('text-danger');
        resultElement.classList.add('text-success');
      } catch (walletError) {
        console.error('钱包交易错误:', walletError);
        throw new Error(`钱包交易失败: ${walletError.message}`);
      }
    } else {
      // 原有逻辑 - 直接通过API调用合约函数
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
    if (signer.type === 'wallet' && !isRead) {
      submitBtn.textContent = '使用钱包发送';
    } else {
      submitBtn.textContent = isRead ? '调用' : '发送';
    }
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