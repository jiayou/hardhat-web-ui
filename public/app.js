document.addEventListener('DOMContentLoaded', function() {
  // 初始化高亮插件

  // 全局变量
  let currentContract = null;
  let contractInstances = {};
  const socket = io();

  // DOM元素
  const contractList = document.getElementById('contractList');
  const contractTitle = document.getElementById('contractTitle');
  const noContractSelected = document.getElementById('noContractSelected');
  const contractInfo = document.getElementById('contractInfo');
  const contractAbi = document.getElementById('contractAbi');
  const contractDetailsInfo = document.getElementById('contractDetails-info');
  const constructorParams = document.getElementById('constructorParams');
  const deployBtn = document.getElementById('deployBtn');
  const deployResult = document.getElementById('deployResult');
  const contractAddress = document.getElementById('contractAddress');
  const loadContractBtn = document.getElementById('loadContractBtn');
  const readFunctions = document.getElementById('readFunctions');
  const writeFunctions = document.getElementById('writeFunctions');
  const contractSource = document.getElementById('contractSource');
  const toast = document.getElementById('toast');
  const toastTitle = document.getElementById('toastTitle');
  const toastMessage = document.getElementById('toastMessage');

  // Bootstrap toast对象
  const toastInstance = new bootstrap.Toast(toast);

  // 加载合约列表
  async function loadContracts() {
    try {
      const response = await fetch('/api/contracts');
      const data = await response.json();

      if (data.contracts && data.contracts.length > 0) {
        contractList.innerHTML = '';
        data.contracts.forEach(contract => {
          const li = document.createElement('li');
          li.className = 'list-group-item';
          li.textContent = contract;
          li.onclick = () => loadContractDetails(contract);
          contractList.appendChild(li);
        });
      } else {
        contractList.innerHTML = '<li class="list-group-item text-center">No contracts found</li>';
      }
    } catch (error) {
      console.error('Error loading contracts:', error);
      contractList.innerHTML = '<li class="list-group-item text-center text-danger">Failed to load contracts</li>';
      showToast('Error', 'Failed to load contracts: ' + error.message);
    }
  }

  // 加载合约详情
  async function loadContractDetails(contractName) {
    try {
      // 更新UI状态
      document.querySelectorAll('.contract-list .list-group-item').forEach(item => {
        item.classList.remove('active');
        if (item.textContent === contractName) {
          item.classList.add('active');
        }
      });

      contractTitle.textContent = contractName;
      noContractSelected.style.display = 'none';
      contractInfo.style.display = 'block';

      // 获取合约详情
      const response = await fetch(`/api/contract/${encodeURIComponent(contractName)}`);
      const data = await response.json();

      if (data.contract) {
        currentContract = data.contract;

        // 显示ABI
        contractAbi.textContent = JSON.stringify(currentContract.abi, null, 2);

        // 显示合约信息
        const info = [
          ['Name', contractName],
          ['Bytecode Size', (currentContract.bytecode.length / 2 - 1) + ' bytes'],
          ['Functions', currentContract.abi.filter(item => item.type === 'function').length],
          ['Events', currentContract.abi.filter(item => item.type === 'event').length],
        ];

        contractDetailsInfo.innerHTML = info.map(([key, value]) => 
          `<tr><th>${key}</th><td>${value}</td></tr>`
        ).join('');

        // 显示构造函数参数
        const constructor = currentContract.abi.find(item => item.type === 'constructor');
        if (constructor && constructor.inputs.length > 0) {
          constructorParams.innerHTML = '<h6 class="mb-3">Constructor Parameters:</h6>' +
            constructor.inputs.map((input, index) => `
              <div class="mb-3">
                <label class="form-label">${input.name || 'param' + index} (${input.type})</label>
                <input type="text" class="form-control constructor-param" data-type="${input.type}" placeholder="Enter ${input.type}">
              </div>
            `).join('');
        } else {
          constructorParams.innerHTML = '<p class="text-muted">No constructor parameters required</p>';
        }

        // 清空交互区域
        contractAddress.value = '';
        readFunctions.innerHTML = '<p class="text-center text-muted">Please load a contract first</p>';
        writeFunctions.innerHTML = '<p class="text-center text-muted">Please load a contract first</p>';

        // 显示合约源代码（如果合约信息中包含源代码）
        if (currentContract.source) {
          contractSource.textContent = currentContract.source;
        } else {
          contractSource.textContent = '// Source code not available';
        }
      }
    } catch (error) {
      console.error('Error loading contract details:', error);
      showToast('Error', 'Failed to load contract details: ' + error.message);
    }
  }

  // 部署合约
  async function deployContract() {
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
      deployBtn.disabled = true;
      deployBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Deploying...';

      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractName: currentContract.contractName,
          args: args
        }),
      });

      const data = await response.json();

      if (data.success && data.address) {
        deployResult.innerHTML = `
          <div class="alert alert-success">
            <h5>Deployment Successful!</h5>
            <p>Contract Address: <strong>${data.address}</strong></p>
            <button class="btn btn-sm btn-outline-primary copy-btn" data-address="${data.address}">Copy Address</button>
          </div>
        `;

        // 自动填充合约地址到交互标签页
        contractAddress.value = data.address;

        // 切换到交互标签页
        const interactTab = document.getElementById('interact-tab');
        bootstrap.Tab.getOrCreateInstance(interactTab).show();

        // 加载合约实例
        loadContractInstance(data.address);
      } else {
        deployResult.innerHTML = `
          <div class="alert alert-danger">
            <h5>Deployment Failed</h5>
            <p>${data.error || 'Unknown error occurred'}</p>
            ${data.details ? `<pre class="mt-2">${data.details}</pre>` : ''}
          </div>
        `;
      }

      // 设置复制地址的点击事件
      document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          navigator.clipboard.writeText(this.getAttribute('data-address'));
          showToast('Success', 'Contract address copied to clipboard');
        });
      });
    } catch (error) {
      console.error('Error deploying contract:', error);
      deployResult.innerHTML = `
        <div class="alert alert-danger">
          <h5>Deployment Failed</h5>
          <p>${error.message}</p>
        </div>
      `;
    } finally {
      deployBtn.disabled = false;
      deployBtn.textContent = 'Deploy Contract';
    }
  }

  // 加载合约实例
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
      if (readFns.length > 0) {
        readFunctions.innerHTML = readFns.map((fn, index) => createFunctionCard(fn, index, true)).join('');
      } else {
        readFunctions.innerHTML = '<p class="text-center text-muted">No read functions available</p>';
      }

      // 显示写入函数
      if (writeFns.length > 0) {
        writeFunctions.innerHTML = writeFns.map((fn, index) => createFunctionCard(fn, index, false)).join('');
      } else {
        writeFunctions.innerHTML = '<p class="text-center text-muted">No write functions available</p>';
      }

      // 保存合约实例
      contractInstances[address] = {
        name: currentContract.contractName,
        address: address
      };

      // 设置函数调用事件
      document.querySelectorAll('.call-function-btn').forEach(btn => {
        btn.addEventListener('click', callContractFunction);
      });
    } catch (error) {
      console.error('Error loading contract instance:', error);
      showToast('Error', 'Failed to load contract instance: ' + error.message);
    }
  }

  // 创建函数卡片
  function createFunctionCard(fn, index, isRead) {
    const id = `${isRead ? 'read' : 'write'}-fn-${index}`;
    const payable = fn.stateMutability === 'payable';

    return `
      <div class="card function-card">
        <div class="card-header bg-light">
          ${fn.name}
        </div>
        <div class="card-body">
          <form id="${id}-form">
            ${fn.inputs.length > 0 ? 
              fn.inputs.map((input, i) => `
                <div class="function-param">
                  <label class="form-label">${input.name || 'param' + i} (${input.type})</label>
                  <input type="text" class="form-control function-param-input" data-type="${input.type}" placeholder="Enter ${input.type}">
                </div>
              `).join('') : 
              '<p class="text-muted">No parameters required</p>'
            }

            ${payable ? `
              <div class="function-param mt-3">
                <label class="form-label">Value (ETH)</label>
                <input type="text" class="form-control" id="${id}-value" placeholder="0">
              </div>
            ` : ''}

            <button type="button" class="btn ${isRead ? 'btn-info' : 'btn-warning'} mt-3 call-function-btn" 
                    data-function="${fn.name}" 
                    data-payable="${payable}" 
                    data-read="${isRead}">
              ${isRead ? 'Read' : 'Write'}
            </button>

            <div class="function-result" id="${id}-result" style="display: none;">
              <h6>Result:</h6>
              <pre><code class="result-value"></code></pre>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // 调用合约函数
  async function callContractFunction(event) {
    const btn = event.currentTarget;
    const address = contractAddress.value.trim();
    const functionName = btn.getAttribute('data-function');
    const isRead = btn.getAttribute('data-read') === 'true';
    const isPayable = btn.getAttribute('data-payable') === 'true';

    const cardElement = btn.closest('.function-card');
    const resultElement = cardElement.querySelector('.function-result');
    const resultValueElement = cardElement.querySelector('.result-value');
    const inputs = cardElement.querySelectorAll('.function-param-input');

    // 构建参数数组
    const args = [];
    inputs.forEach(input => {
      args.push(input.value.trim());
    });

    // 获取支付金额（如果有）
    let value = '0';
    if (isPayable) {
      const valueInput = cardElement.querySelector('input[id$="-value"]');
      if (valueInput) {
        value = valueInput.value.trim() || '0';
      }
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> ' + (isRead ? 'Reading...' : 'Writing...');

    try {
      const response = await fetch('/api/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractName: currentContract.contractName,
          contractAddress: address,
          method: functionName,
          args: args,
          value: value
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 显示结果
        resultElement.style.display = 'block';

        if (isRead) {
          // 格式化结果
          let formattedResult;

          if (typeof data.result === 'object') {
            formattedResult = JSON.stringify(data.result, null, 2);
          } else {
            formattedResult = String(data.result);
          }

          resultValueElement.textContent = formattedResult;
        } else {
          resultValueElement.textContent = `Transaction successful: ${data.txHash}`;
        }

          showToast('Success', isRead ? 'Function call successful' : 'Transaction successful');
      } else {
        resultElement.style.display = 'block';
        resultValueElement.textContent = `Error: ${data.error} ${data.details || ''}`;
          showToast('Error', 'Function call failed');
      }
    } catch (error) {
      console.error('Error calling function:', error);
      resultElement.style.display = 'block';
      resultValueElement.textContent = `Error: ${error.message}`;
      showToast('Error', 'Function call failed');
    } finally {
      btn.disabled = false;
      btn.textContent = isRead ? 'Read' : 'Write';
    }
  }

  // 显示提示消息
  function showToast_(title, message) {
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    toastInstance.show();
  }

  // 显示提示信息
  function showToast(title, message) {
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    const toastInstance = new bootstrap.Toast(toast);
    toastInstance.show();
  }

  // 绑定事件
  deployBtn.addEventListener('click', deployContract);

  loadContractBtn.addEventListener('click', function() {
    const address = contractAddress.value.trim();
    if (address) {
      loadContractInstance(address);
    } else {
      showToast('Error', 'Please enter a contract address');
    }
  });

  // 初始加载合约列表
  loadContracts();

  // Socket.io 事件监听
  socket.on('contract-deployed', function(data) {
    showToast('New Contract', `Contract deployed at ${data.address}`);
  });

  socket.on('tx-confirmed', function(data) {
    showToast('Transaction Confirmed', `Transaction ${data.txHash} confirmed`);
  });
});