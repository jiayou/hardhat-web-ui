/**
 * 合约部署视图模块
 */

import { showToast } from '../utils.js';
import { currentSigner } from '../state.js';
import { getCurrentContract } from './contract.js';
import TransactionConfirm from '../widgets/transaction_confirm.js';
import WaitReceipt from '../widgets/wait_receipt.js';

/**
 * 渲染合约部署视图
 * @returns {string} HTML内容
 */
export function renderContractDeploy() {
  return `
    <div class="card">
      <div class="card-header">
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="mb-0">部署合约</h5>
        </div>
      </div>
      <div class="card-body">
        <div id="constructorParams" class="my-4"></div>
        <button id="deployBtn" class="btn btn-primary">部署合约</button>
        <div id="deployResult" class="mt-4"></div>
      </div>
    </div>
  `;
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
 * 初始化合约部署视图
 * @param {Function} deployHandler - 部署处理函数
 */
export function initContractDeployView(onDeploySuccess) {

  // 获取部署按钮
  const deployBtn = document.getElementById('deployBtn');
  const deployResult = document.getElementById('deployResult');
  if (!deployBtn) return

  deployBtn.addEventListener('click', () => {
    
    const contract = getCurrentContract();

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
    else {
      showToast('Error', 'Invalid constructor parameters');
      return;
    }

    deployBtn.disabled = true;
    deployBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> 部署中...';
      
    // 获取当前签名者类型
    const signerInfo = currentSigner();
    if (signerInfo && signerInfo.type === 'wallet') {
      // 钱包部署方式

      // 确认是否有可用的以太坊钱包
      if (!window.ethereum) {
        deployResult.innerHTML = `
          <div class="alert alert-danger">
            <h5>部署失败</h5>
            <p>未检测到MetaMask或其他以太坊钱包</p>
          </div>
        `;
        // TODO:WALLET
        // return;
      }

      fetch('/api/contract/prepare-deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: signerInfo.address,
          contractName: contract.contractName,
          bytecode: contract.bytecode,
          args
        }),
      })
      .then(response => {
        if (!response.ok) {
          showToast('Error', '准备部署失败:' + response.statusText);
          return;
        }

        response.json().then(data => {
          // 显示转账确认框
          console.log("prepare-transfer response: ", data);
          TransactionConfirm.show(data.txData);
        })

      })
      .catch (error => {
        console.error('Error deploying contract:', error);
        showToast('Error', 'Failed to deploy contract: ' + error.message);
        document.getElementById('deployResult').innerHTML = `
          <div class="alert alert-danger">
            <h5>部署失败</h5>
            <p>${error.message}</p>
          </div>
        `;
      })


    } else {
      // 测试账户部署
      fetch('/api/contract/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractName: contract.contractName,
          args: args,
          signer: signerInfo.address
        }),
      })
      .then(response => {
        if (!response.ok) {
          console.error(response);
          throw new Error(`Network error: ${response.status} ${response.statusText}`);
        }
        response.json().then(data => {
          console.log("Deploy result:", data);
          const txHash = data.deployTransaction.hash;
          WaitReceipt.show(txHash).then(() => {
            // 调用部署成功回调
            if (typeof onDeploySuccess === 'function') {
              onDeploySuccess(data.address);
            }
          })
        })
      })
      .catch (error => {
        console.error('Error deploying contract:', error);
        showToast('Error', 'Failed to deploy contract: ' + error.message);
        document.getElementById('deployResult').innerHTML = `
          <div class="alert alert-danger">
            <h5>部署失败</h5>
            <p>${error.message}</p>
          </div>
        `;
        throw error;
      })
      .finally(() => {
        const deployBtn = document.getElementById('deployBtn');
        deployBtn.disabled = false;
        deployBtn.textContent = '部署合约';
      })
    }

  })
}
