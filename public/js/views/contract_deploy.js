/**
 * 合约部署视图模块
 */

import { showToast } from '../utils.js';
import { currentSigner } from '../state.js';
import { getCurrentContract } from './contract.js';
import TransactionConfirm from '../widgets/transaction_confirm.js';
import WaitReceipt from '../widgets/wait_receipt.js';
import { t } from '../i18n.js';

/**
 * 渲染合约部署视图
 * @returns {string} HTML内容
 */
export function renderContractDeploy() {
  return `
    <div class="card">
      <div class="card-header">
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="mb-0">${t('contract.deployContract')}</h5>
        </div>
      </div>
      <div class="card-body">
        <div id="constructorParams" class="my-4"></div>
        <button id="deployBtn" class="btn btn-primary">${t('contract.deployContract')}</button>
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
    constructorParams.innerHTML = `<h6 class="mb-3">${t('contract.constructorParams')}:</h6>` +
      constructor.inputs.map((input, index) => `
        <div class="mb-3">
          <label class="form-label">${input.name || 'param' + index} (${input.type})</label>
          <input type="text" class="form-control constructor-param" data-type="${input.type}" placeholder="${t('contract.paramPlaceholder').replace('{type}', input.type)}">
        </div>
      `).join('');
  } else {
    constructorParams.innerHTML = `<p class="text-muted">${t('contract.noConstructorParams')}</p>`;
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
        showToast(t('common.error'), t('contract.invalidParams'));
        return;
      }

      for (let i = 0; i < paramInputs.length; i++) {
        const value = paramInputs[i].value.trim();
        if (!value && !constructor.inputs[i].name.includes('optional')) {
          showToast(t('common.error'), t('contract.paramRequired').replace('{name}', constructor.inputs[i].name || i));
          return;
        }
        args.push(value);
      }
    }
    else {
      showToast(t('common.error'), t('contract.invalidParams'));
      return;
    }

    deployBtn.disabled = true;
    deployBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> ${t('contract.deploying')}`;
      
    // 获取当前签名者类型
    const signerInfo = currentSigner();
    if (signerInfo && signerInfo.type === 'wallet') {
      // 钱包部署方式

      // 确认是否有可用的以太坊钱包
      if (!window.ethereum) {
        deployResult.innerHTML = `
          <div class="alert alert-danger">
            <h5>${t('contract.deployFailed')}</h5>
            <p>${t('contract.noWallet')}</p>
          </div>
        `;
        throw new Error("MetaMask未安装或不可用");
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
          showToast(t('common.error'), t('contract.prepareDeployFailed') + ': ' + response.statusText);
          return;
        }

        response.json().then(data => {
          // 显示转账确认框
          console.log("prepare-transfer response: ", data);
          TransactionConfirm.show(data.txData).then(result => {
            // 可以根据 result.success 和 result.action 进行不同的后续处理
            // 调用部署成功回调
            if (typeof onDeploySuccess === 'function' && result.txHash) {
              // 从交易哈希中查询合约地址
              fetchContractAddressFromTxHash(result.txHash)
                .then(address => {
                  if (address) {
                    onDeploySuccess(address);
                  } else {
                    console.error('未能从交易中获取合约地址');
                  }
                })
                .catch(error => {
                  console.error('获取合约地址时出错:', error);
                });
            }
          });
        })

      })
      .catch (error => {
        console.error(t('contract.deployError') + ':', error);
        showToast(t('common.error'), t('contract.deployError') + ': ' + error.message);
        document.getElementById('deployResult').innerHTML = `
          <div class="alert alert-danger">
            <h5>${t('contract.deployFailed')}</h5>
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
        console.error(t('contract.deployError') + ':', error);
        showToast(t('common.error'), t('contract.deployError') + ': ' + error.message);
        document.getElementById('deployResult').innerHTML = `
          <div class="alert alert-danger">
            <h5>${t('contract.deployFailed')}</h5>
            <p>${error.message}</p>
          </div>
        `;
        throw error;
      })
      .finally(() => {
        const deployBtn = document.getElementById('deployBtn');
        deployBtn.disabled = false;
        deployBtn.textContent = t('contract.deployContract');
      })
    }

  })

  /**
   * 从交易哈希中查询合约地址
   * @param {string} txHash - 交易哈希
   * @returns {Promise<string>} 部署的合约地址
   */
  function fetchContractAddressFromTxHash(txHash) {
    return new Promise((resolve, reject) => {
      // 轮询交易回执以获取合约地址
      const checkReceipt = () => {
        fetch(`/api/transaction/${txHash}`)
          .then(response => response.json())
          .then(data => {
            if (data.receipt) {
              // 交易已确认，获取合约地址
              const contractAddress = data.receipt.contractAddress;
              if (contractAddress) {
                resolve(contractAddress);
              } else {
                // 交易成功但没有合约地址（可能不是合约部署交易）
                reject(new Error('交易成功但未创建合约'));
              }
            } else {
              // 交易尚未确认，继续轮询
              setTimeout(checkReceipt, 2000);
            }
          })
          .catch(error => {
            console.error('轮询交易回执时出错:', error);
            reject(error);
          });
      };

      // 开始轮询
      checkReceipt();
    });
  }
}
