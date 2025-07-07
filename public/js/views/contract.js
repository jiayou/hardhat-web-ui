/**
 * 合约视图
 */

import { showToast, shortenAddress } from '../utils.js';
import { fetchContracts, fetchContractDetails, deployContract, callContractFunction } from '../api.js';

// 当前选中的合约
let currentContract = null;
// 合约实例缓存
let contractInstances = {};

/**
 * 渲染合约视图
 * @returns {string} HTML内容
 */
const ContractView = async () => {
  try {
    const data = await fetchContracts();
    
    return `
      <div class="row mt-4">
        <div class="col-md-3 sidebar">
          <div class="card mb-4">
            <div class="card-header bg-light">
              <h5 class="mb-0">可用合约</h5>
            </div>
            <ul class="list-group list-group-flush contract-list" id="contractList">
              ${data.contracts && data.contracts.length > 0 ?
                data.contracts.map(contract => `
                  <li class="list-group-item" data-contract="${contract}">${contract}</li>
                `).join('') :
                '<li class="list-group-item text-center">无可用合约</li>'}
            </ul>
          </div>
        </div>
        
        <div class="col-md-9">
          <div id="noContractSelected" class="text-center p-5">
            <h4 class="text-secondary">请从左侧选择一个合约</h4>
            <p class="text-muted">点击合约名称查看详情</p>
          </div>
          
          <div id="contractInfo" style="display: none;">
            <h3 id="contractTitle" class="mb-4">Contract Name</h3>
            
            <ul class="nav nav-tabs" id="contractTabs" role="tablist">
              <li class="nav-item" role="presentation">
                <button class="nav-link active" id="details-tab" data-bs-toggle="tab" data-bs-target="#details" type="button" role="tab">详情</button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="deploy-tab" data-bs-toggle="tab" data-bs-target="#deploy" type="button" role="tab">部署</button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="interact-tab" data-bs-toggle="tab" data-bs-target="#interact" type="button" role="tab">交互</button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="source-tab" data-bs-toggle="tab" data-bs-target="#source" type="button" role="tab">源代码</button>
              </li>
            </ul>
            
            <div class="tab-content p-3 border border-top-0 rounded-bottom mb-4">
              <!-- 详情标签页 -->
              <div class="tab-pane fade show active" id="details" role="tabpanel">
                <div class="row">
                  <div class="col-md-6">
                    <h5>合约信息</h5>
                    <table class="table">
                      <tbody id="contractDetails-info"></tbody>
                    </table>
                    
                    <h5 class="mt-4">合约字节码</h5>
                    <div class="bytecode-container">
                      <textarea id="contractBytecode" class="form-control" readonly style="font-family: monospace; font-size: 0.85rem; height: 150px;"></textarea>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <h5>ABI</h5>
                    <div class="abi-container">
                      <textarea id="contractAbi" class="form-control" readonly style="font-family: monospace; font-size: 0.85rem; height: 150px;"></textarea>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 部署标签页 -->
              <div class="tab-pane fade" id="deploy" role="tabpanel">
                <h5>部署合约</h5>
                <div id="constructorParams" class="my-4"></div>
                <button id="deployBtn" class="btn btn-primary">部署合约</button>
                <div id="deployResult" class="mt-4"></div>
              </div>
              
              <!-- 交互标签页 -->
              <div class="tab-pane fade" id="interact" role="tabpanel">
                <div class="mb-4">
                  <h5>合约实例</h5>
                  <div class="input-group mb-3">
                    <input type="text" class="form-control" placeholder="合约地址" id="contractAddress">
                    <button class="btn btn-outline-secondary" type="button" id="loadContractBtn">加载合约</button>
                  </div>
                </div>
                
                <div class="row">
                  <div class="col-md-6">
                    <h5>读取函数</h5>
                    <div id="readFunctions">
                      <p class="text-center text-muted">请先加载合约</p>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <h5>写入函数</h5>
                    <div id="writeFunctions">
                      <p class="text-center text-muted">请先加载合约</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 源代码标签页 -->
              <div class="tab-pane fade" id="source" role="tabpanel">
                <h5>源代码</h5>
                <pre><code id="contractSource" class="language-solidity"></code></pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error rendering contract view:', error);
    showToast('Error', 'Failed to load contracts');
    return `<div class="alert alert-danger m-5">Failed to load contracts: ${error.message}</div>`;
  }
};

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
 * 加载合约详情
 * @param {string} contractName - 合约名称
 */
async function loadContractDetails(contractName) {
  try {
    // 更新UI状态
    document.querySelectorAll('.contract-list .list-group-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.contract === contractName) {
        item.classList.add('active');
      }
    });

    document.getElementById('contractTitle').textContent = contractName;
    document.getElementById('noContractSelected').style.display = 'none';
    document.getElementById('contractInfo').style.display = 'block';

    // 获取合约详情
    const data = await fetchContractDetails(contractName);

    if (data.contract) {
      currentContract = data.contract;

      // 显示ABI
      document.getElementById('contractAbi').textContent = JSON.stringify(currentContract.abi, null, 2);
      // 显示字节码
      document.getElementById('contractBytecode').textContent = currentContract.bytecode;
      
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
      
      // 监听窗口大小变化
      window.addEventListener('resize', adjustByteCodeHeight);
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
      
      // 监听窗口大小变化，同时更新ABI高度
      window.removeEventListener('resize', adjustByteCodeHeight);
      window.addEventListener('resize', function() {
        adjustByteCodeHeight();
        adjustAbiHeight();
      });

      // 显示合约信息
      const info = [
        ['Name', contractName],
        ['Bytecode Size', (currentContract.bytecode.length / 2 - 1) + ' bytes'],
        ['Functions', currentContract.abi.filter(item => item.type === 'function').length],
        ['Events', currentContract.abi.filter(item => item.type === 'event').length],
      ];

      document.getElementById('contractDetails-info').innerHTML = info.map(([key, value]) =>
        `<tr><th>${key}</th><td>${value}</td></tr>`
      ).join('');

      // 显示构造函数参数
      const constructorParams = document.getElementById('constructorParams');
      const constructor = currentContract.abi.find(item => item.type === 'constructor');
      
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

      // 清空交互区域
      document.getElementById('contractAddress').value = '';
      document.getElementById('readFunctions').innerHTML = '<p class="text-center text-muted">请先加载合约</p>';
      document.getElementById('writeFunctions').innerHTML = '<p class="text-center text-muted">请先加载合约</p>';

      // 显示合约源代码
      const contractSource = document.getElementById('contractSource');
      if (currentContract.source) {
        contractSource.textContent = currentContract.source;
      } else {
        contractSource.textContent = '// Source code not available';
      }
      
      if (typeof hljs !== 'undefined') {
        hljs.highlightElement(contractSource);
      }
    }
  } catch (error) {
    console.error('Error loading contract details:', error);
    showToast('Error', 'Failed to load contract details: ' + error.message);
  }
}

/**
 * 部署合约
 */
async function handleDeployContract() {
  if (!currentContract) return;

  const args = [];
  const constructor = currentContract.abi.find(item => item.type === 'constructor');

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

    const data = await deployContract(currentContract.contractName, args);

    if (data.success && data.address) {
      deployResult.innerHTML = `
        <div class="alert alert-success">
          <h5>部署成功!</h5>
          <p>合约地址: <strong>${data.address}</strong></p>
          <button class="btn btn-sm btn-outline-primary copy-btn" data-address="${data.address}">复制地址</button>
        </div>
      `;

      // 自动填充合约地址到交互标签页
      document.getElementById('contractAddress').value = data.address;

      // 切换到交互标签页
      const interactTab = document.getElementById('interact-tab');
      bootstrap.Tab.getOrCreateInstance(interactTab).show();

      // 加载合约实例
      loadContractInstance(data.address);
      
      // 设置复制按钮点击事件
      document.querySelector('.copy-btn').addEventListener('click', function() {
        navigator.clipboard.writeText(this.getAttribute('data-address'));
        showToast('Success', '合约地址已复制到剪贴板');
      });
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
 * 加载合约实例
 * @param {string} address - 合约地址
 */
async function loadContractInstance(address) {
  if (!currentContract || !address) return;

  try {
    // 区分读取和写入函数
    const readFns = currentContract.abi.filter(item =>
      item.type === 'function' &&
      (item.stateMutability === 'view' || item.stateMutability === 'pure')
    );

    const writeFns = currentContract.abi.filter(item =>
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
      name: currentContract.contractName,
      address: address
    };

    // 设置函数调用事件
    document.querySelectorAll('.function-form').forEach(form => {
      form.addEventListener('submit', handleFunctionCall);
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
 */
async function handleFunctionCall(e) {
  e.preventDefault();
  const form = e.target;
  const functionName = form.dataset.fnName;
  const isPaayable = form.dataset.fnPayable === 'true';
  const address = document.getElementById('contractAddress').value;
  
  if (!address || !functionName || !currentContract) {
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
      currentContract.contractName,
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
 * 合约视图初始化函数
 */
ContractView.init = () => {
  // 绑定合约列表点击事件
  document.querySelectorAll('.contract-list .list-group-item').forEach(item => {
    item.addEventListener('click', () => loadContractDetails(item.dataset.contract));
  });
  
  // 绑定部署按钮事件
  const deployBtn = document.getElementById('deployBtn');
  if (deployBtn) {
    deployBtn.addEventListener('click', handleDeployContract);
  }
  
  // 绑定加载合约按钮事件
  const loadContractBtn = document.getElementById('loadContractBtn');
  if (loadContractBtn) {
    loadContractBtn.addEventListener('click', () => {
      const address = document.getElementById('contractAddress').value.trim();
      if (address) {
        loadContractInstance(address);
      } else {
        showToast('Error', 'Please enter a contract address');
      }
    });
  }
  
  // 高亮代码
  document.querySelectorAll('pre code').forEach((block) => {
    if (window.hljs) {
      window.hljs.highlightElement(block);
    }
  });
};

// 导出默认视图函数
export default ContractView;
