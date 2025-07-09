/**
 * 合约部署视图模块
 */

import { showToast } from '../utils.js';
import { currentSigner } from '../state.js';


/**
 * 部署合约
 * @param {string} contractName - 合约名称
 * @param {Array} args - 构造函数参数
 * @returns {Promise} 包含部署结果的Promise
 */
async function deployContract(contractName, args) {
  try {
    // 获取当前选中的signer
    const signer = currentSigner().address;
    console.log("deploy contract with signer:", signer)
    
    const response = await fetch('/api/contract/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contractName: contractName,
        args: args,
        signer: signer // 自动附加当前signer
      }),
    });
    if (!response.ok) {
      throw new Error(`Network error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error deploying contract:', error);
    showToast('Error', 'Failed to deploy contract: ' + error.message);
    throw error;
  }
}

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
    constructorParams.innerHTML = '<div class="mb-3">\n' +
    '  <label class="form-label">部署价值 (ETH)</label>\n' +
    '  <input type="number" step="0.0001" class="form-control" id="deployValue" placeholder="0.0">\n' +
    '</div>\n' +
    '<h6 class="mb-3">构造函数参数:</h6>' +
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
    
    // 获取当前签名者类型
    const signerInfo = currentSigner();
    
    // 根据签名者类型选择不同的部署方式
    if (signerInfo && signerInfo.type === 'wallet') {
      // 钱包部署方式
      await handleWalletDeploy(contract, args, deployResult, onDeploySuccess);
    } else {
      // 常规部署方式
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
 * 使用外部钱包处理合约部署
 * @param {Object} contract - 当前选中的合约对象
 * @param {Array} args - 构造函数参数
 * @param {HTMLElement} deployResult - 部署结果显示元素
 * @param {Function} onDeploySuccess - 部署成功的回调函数
 */
async function handleWalletDeploy(contract, args, deployResult, onDeploySuccess) {
  const signerInfo = currentSigner();
  
  // 确认是否有可用的以太坊钱包
  if (!window.ethereum) {
    deployResult.innerHTML = `
      <div class="alert alert-danger">
        <h5>部署失败</h5>
        <p>未检测到MetaMask或其他以太坊钱包</p>
      </div>
    `;
    // return;
  }
  
  try {
    // 1. 从后端获取部署数据
    deployResult.innerHTML = `
      <div class="alert alert-success">
        <h5>正在准备交易数据，请等待...</h5>
      </div>
    `;
    const deployValue = document.getElementById('deployValue').value || '0';
    await fetch('/api/prepare-deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: signerInfo.address,
        contractName: contract.contractName,
        bytecode: contract.bytecode,
        args,
        value: deployValue
      }),
    }).then(response => response.json())

      // 2. 请求钱包发送交易，等待确认
      deployResult.innerHTML = `
        <div class="alert alert-warning">
          <h5>交易已提交!</h5>
          <p>交易哈希: <strong>${txHash}</strong></p>
          <p>等待交易确认...</p>
          <div class="progress mt-2">
            <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 100%"></div>
          </div>
        </div>
      `;

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [prepareData.txData],
      });
      
    
      // 4. 等待交易确认并获取合约地址
      // 需要等待交易被确认，然后获取合约地址
      // 这里可以添加一个轮询机制来检查交易状态
      // 或者监听以太坊的交易确认事件
      
      // 简单实现：等待一段时间后检查交易收据
      setTimeout(async () => {
        try {
          const receipt = await window.ethereum.request({
            method: 'eth_getTransactionReceipt',
            params: [txHash],
          });
          
          if (receipt && receipt.contractAddress) {
            // 部署成功
            deployResult.innerHTML = `
              <div class="alert alert-success">
                <h5>部署成功!</h5>
                <p>合约地址: <strong>${receipt.contractAddress}</strong></p>
                <button class="btn btn-sm btn-outline-primary copy-btn" data-address="${receipt.contractAddress}">复制地址</button>
              </div>
            `;
            
            // 设置复制按钮点击事件
            document.querySelector('.copy-btn').addEventListener('click', function() {
              navigator.clipboard.writeText(this.getAttribute('data-address'));
              showToast('Success', '合约地址已复制到剪贴板');
            });
            
            // 调用部署成功回调
            if (typeof onDeploySuccess === 'function') {
              onDeploySuccess(receipt.contractAddress);
            }
          } else {
            // 交易还未确认，提示用户可以稍后在区块浏览器中查看
            deployResult.innerHTML = `
              <div class="alert alert-info">
                <h5>交易已提交</h5>
                <p>交易哈希: <strong>${txHash}</strong></p>
                <p>交易尚未被确认，请稍后在区块浏览器中查看结果</p>
              </div>
            `;
          }
        } catch (error) {
          console.error('获取交易收据失败:', error);
          deployResult.innerHTML = `
            <div class="alert alert-warning">
              <h5>交易状态未知</h5>
              <p>交易哈希: <strong>${txHash}</strong></p>
              <p>无法获取交易状态: ${error.message}</p>
            </div>
          `;
        }
      }, 5000); // 等待5秒后检查

  } catch (error) {
    console.error('Error in wallet deploy:', error);
    deployResult.innerHTML = `
      <div class="alert alert-danger">
        <h5>钱包交易失败</h5>
        <p>${error.message}</p>
      </div>
    `;
  }
}

/**
 * 初始化合约部署视图
 * @param {Function} deployHandler - 部署处理函数
 */
export function initContractDeployView(deployHandler) {
  // 获取部署按钮
  const deployBtn = document.getElementById('deployBtn');
  if (deployBtn) {
    // 检查当前签名者类型
    const signerInfo = currentSigner();
    
    // 如果是钱包签名者，将按钮显示为红色
    if (signerInfo && signerInfo.type === 'wallet') {
      deployBtn.classList.remove('btn-primary');
      deployBtn.classList.add('btn-danger');
    } else {
      deployBtn.classList.remove('btn-danger');
      deployBtn.classList.add('btn-primary');
    }
    
    // 绑定部署按钮事件
    deployBtn.addEventListener('click', deployHandler);
  }
}
