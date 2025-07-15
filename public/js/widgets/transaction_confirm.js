/**
 * 转账确认组件
 */

import { showToast } from '../utils.js';
import WaitReceipt from './wait_receipt.js'
import { t } from '../i18n.js';
/**
 * 转账确认模态框组件
 */
const TransactionConfirm = {
  /**
   * 显示转账确认对话框
   * @param {Object} txData - 转账数据
   * txData: Object { 
      chainId: "0x7a69"
      from: "0x1111111111111111111111111111111111111111"
      to: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
      gas: "0x5208"
      gasPrice: "0x3bf36bd6"
      nonce: "0x0"
      value: "0x1bc16d674ec80000"
    }
   */
  show: function(txData) {
    // 创建Promise并返回
    return new Promise((resolve) => {
    // 解析交易数据
    const fromAddress = txData.from;
    const targetAddress = txData.to;
    
    // 只有当txData中存在value字段时才解析金额
    let amount;
    if (txData.value !== undefined) {
      // 将十六进制的value转换为ETH显示值
      const valueInWei = parseInt(txData.value, 16);
      amount = (valueInWei / 1e18).toFixed(6); // 转换为ETH并保留6位小数
    }
    
    const gas = parseInt(txData.gas, 16);
    const gasPrice = parseInt(txData.gasPrice, 16) / 1e9; // 转换为Gwei
    const nonce = parseInt(txData.nonce, 16);
    const chainId = parseInt(txData.chainId, 16);
    
    console.log("amount", amount)

    // 移除可能存在的旧模态框
    const existingModal = document.getElementById('transactionConfirmModal');
    if (existingModal) {
      existingModal.remove();
    }

    // 创建确认对话框的基本结构
    let modalBody = `
      <div class="modal fade" id="transactionConfirmModal" tabindex="-1" aria-labelledby="transactionConfirmModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="transactionConfirmModalLabel">${t('transactionConfirm.title')}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <h6 class="mb-3">${t('transactionConfirm.aboutToConfirm')}</h6>
              <div class="table-responsive">
                <table class="table table-bordered table-sm">
                  <tbody>
                    <tr>
                      <th class="table-light" style="width: 25%">${t('transactionConfirm.fromAddress')}</th>
                      <td><code>${fromAddress}</code></td>
                    </tr>
                    <tr>
                      <th class="table-light">${t('transactionConfirm.toAddress')}</th>
                      <td><code>${targetAddress}</code></td>
                    </tr>`;
    
    // 只有当txData中存在value字段且解析出了金额时才显示金额行
    if (amount !== undefined) {
      modalBody += `
                    <tr>
                      <th class="table-light">${t('transactionConfirm.amount')}</th>
                      <td><strong id="amount">${amount} ETH</strong></td>
                    </tr>`;
    }
    
    // 如果txData中有data字段，添加数据字节数行
    if (txData.data) {
      // 计算data字节数（去掉0x前缀后，每2个十六进制字符表示一个字节）
      const dataBytes = txData.data.startsWith("0x") ? 
        (txData.data.length - 2) / 2 : 
        txData.data.length / 2;
      
      modalBody += `
                    <tr>
                      <th class="table-light">${t('transactionConfirm.data')}</th>
                      <td>${dataBytes} ${t('transactionConfirm.bytes')}</td>
                    </tr>`;
    }
    
    // 添加其余表格行
    modalBody += `
                    <tr>
                      <th class="table-light">${t('transactionConfirm.gasPrice')}</th>
                      <td>${gasPrice} Gwei</td>
                    </tr>
                    <tr>
                      <th class="table-light">${t('transactionConfirm.gasLimit')}</th>
                      <td>
                        <div class="input-group">
                          <input type="number" class="form-control form-control-sm" id="gasInput" value="${gas}">
                          <button class="btn btn-outline-secondary btn-sm" type="button" id="resetGasBtn" title="${t('transactionConfirm.restoreOriginal')}">
                            <i class="bi bi-arrow-counterclockwise"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th class="table-light">${t('transactionConfirm.nonce')}</th>
                      <td>
                        <div class="input-group">
                          <input type="number" class="form-control form-control-sm" id="nonceInput" value="${nonce}">
                          <button class="btn btn-outline-secondary btn-sm" type="button" id="resetNonceBtn" title="${t('transactionConfirm.restoreOriginal')}">
                            <i class="bi bi-arrow-counterclockwise"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th class="table-light">${t('transactionConfirm.chainId')}</th>
                      <td>${chainId}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div id="txStatusContainer" class="mt-3 d-none">
                <div class="alert alert-info">
                  <div class="d-flex align-items-center">
                    <div class="spinner-border spinner-border-sm me-2" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                    <span id="txStatusMessage">${t('transactionConfirm.transactionProcessing')}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer" id="modalButtons">
              <div class="me-auto">
                <small class="text-muted">${t('transactionConfirm.feeEstimate')}: <span id="feeEstimate">0.0000 ETH</span></small>
              </div>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="cancelBtn">${t('transactionConfirm.cancel')}</button>
              <button type="button" class="btn btn-danger" id="walletTransactionBtn">${t('transactionConfirm.walletTransaction')}</button>
              <button type="button" class="btn btn-success d-none" id="closeBtn" data-bs-dismiss="modal">${t('transactionConfirm.close')}</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // 完整的确认对话框HTML
    const confirmModal = modalBody;

    // 添加模态框到DOM
    document.body.insertAdjacentHTML('beforeend', confirmModal);

    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('transactionConfirmModal'));
    modal.show();

    this._setupEventHandlers(modal, txData, resolve);
  });
  },

  /**
   * 轮询交易状态
   * @param {string} txHash - 交易哈希
   * @param {Function} showTxStatus - 显示交易状态的函数
   */
  _pollTransactionStatus: function(txHash, showTxStatus) {
    let pollCount = 0;
    const maxPolls = 30; // 最多轮询30次，约2.5分钟
    
    const pollInterval = setInterval(() => {
      pollCount++;
      
      fetch(`/api/transaction/${txHash}`)
        .then(response => response.json())
        .then(data => {
          if (data.receipt) {
            // 交易已确认，显示状态
            clearInterval(pollInterval);
            
            const receipt = data.receipt;
            const success = receipt.status === 1;
            const statusContainer = document.getElementById('txStatusContainer');
            
            if (success) {
              statusContainer.querySelector('.alert').classList.remove('alert-info');
              statusContainer.querySelector('.alert').classList.add('alert-success');
              statusContainer.querySelector('.spinner-border').classList.add('d-none');
              
              const successIcon = document.createElement('i');
              successIcon.className = 'bi bi-check-circle me-2';
              statusContainer.querySelector('.d-flex').prepend(successIcon);
              
              const txStatusElem = document.getElementById('txStatusMessage');
              txStatusElem.innerHTML = `${t('transactionConfirm.transactionSuccess')} <a href="#" id="viewReceiptLink2" class="text-primary">${t('transactionConfirm.viewReceipt')}</a>`;
              
              document.getElementById('viewReceiptLink2')?.addEventListener('click', (e) => {
                e.preventDefault();
                WaitReceipt.show(txHash);
              });
            } else {
              statusContainer.querySelector('.alert').classList.remove('alert-info');
              statusContainer.querySelector('.alert').classList.add('alert-danger');
              statusContainer.querySelector('.spinner-border').classList.add('d-none');
              
              const errorIcon = document.createElement('i');
              errorIcon.className = 'bi bi-x-circle me-2';
              statusContainer.querySelector('.d-flex').prepend(errorIcon);
              
              const txStatusElem = document.getElementById('txStatusMessage');
              txStatusElem.innerHTML = `${t('transactionConfirm.transactionFailed')} <a href="#" id="viewReceiptLink2" class="text-primary">${t('transactionConfirm.viewReceipt')}</a>`;
              
              document.getElementById('viewReceiptLink2')?.addEventListener('click', (e) => {
                e.preventDefault();
                WaitReceipt.show(txHash);
              });
            }
          } else if (pollCount >= maxPolls) {
            // 达到最大轮询次数，停止轮询
            clearInterval(pollInterval);
            const txStatusElem = document.getElementById('txStatusMessage');
            if (txStatusElem) {
              txStatusElem.textContent = t('transactionConfirm.processingTooLong');
            }
          }
          // 如果没有收到回执，继续轮询
        })
        .catch(error => {
          console.error('Error polling transaction status:', error);
          // 发生错误时不停止轮询，继续等待
        });
    }, 5000); // 每5秒轮询一次
  },
  
  _setupEventHandlers: function(modal, txData, resolvePromise) {
    // 保存原始值，用于还原按钮
    const originalGas = parseInt(txData.gas, 16);
    const originalNonce = parseInt(txData.nonce, 16);
    const gasPriceGwei = parseInt(txData.gasPrice, 16) / 1e9; // 转换为Gwei

    // 计算并显示费用预估的函数
    const updateFeeEstimate = () => {
      const currentGas = document.getElementById("gasInput").value;
      // 计算费用 (gas * gasPrice)
      const feeWei = currentGas * gasPriceGwei * 1e9; // 转回wei
      const feeEth = feeWei / 1e18; // 转换为ETH
      // 显示4位小数
      document.getElementById("feeEstimate").textContent = feeEth.toFixed(4) + " ETH";
    };

    // 初始计算费用
    updateFeeEstimate();

    // 设置还原按钮的事件处理
    document.getElementById('resetGasBtn')?.addEventListener('click', () => {
      document.getElementById('gasInput').value = originalGas;
      updateFeeEstimate(); // 更新费用预估
    });

    document.getElementById('resetNonceBtn')?.addEventListener('click', () => {
      document.getElementById('nonceInput').value = originalNonce;
    });
    
    // 监听Gas输入变化
    document.getElementById("gasInput")?.addEventListener("input", updateFeeEstimate);

    // 添加显示交易状态的函数
    const showTxStatus = (message, isError = false) => {
      const statusContainer = document.getElementById('txStatusContainer');
      const statusMessage = document.getElementById('txStatusMessage');
      statusContainer.classList.remove('d-none');
      statusMessage.textContent = message;

      if (isError) {
        statusContainer.querySelector('.alert').classList.remove('alert-info');
        statusContainer.querySelector('.alert').classList.add('alert-danger');
        // 显示关闭按钮
        document.getElementById('closeBtn').classList.remove('d-none');
      }
    };

    // 处理按钮显示状态的函数
    const updateButtonsForTx = (showClose = false) => {
      // 隐藏取消和确认按钮
      document.getElementById('cancelBtn').classList.add('d-none');
      const confirmBtn = document.getElementById('confirmTransactionBtn');
      if (confirmBtn) confirmBtn.classList.add('d-none');
      const walletBtn = document.getElementById('walletTransactionBtn');
      if (walletBtn) walletBtn.classList.add('d-none');

      // 如果需要，显示关闭按钮
      if (showClose) {
        document.getElementById('closeBtn').classList.remove('d-none');
      }
    };


    // 监听钱包转账按钮
    document.getElementById('walletTransactionBtn')?.addEventListener('click', () => {
      showTxStatus(t('transactionConfirm.confirmInWallet'));

      // 更新txData中的gas和nonce值
      const newGas = document.getElementById('gasInput').value;
      const newNonce = document.getElementById('nonceInput').value;
      
      // 转换为十六进制
      txData.gas = '0x' + parseInt(newGas).toString(16);
      txData.nonce = '0x' + parseInt(newNonce).toString(16);
      
      // 使用MetaMask直接发送交易
      console.log('MetaMask 发起转账，请耐心等待钱包确认');
      window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txData]
      })
      .then((txHash) => {
        console.log('Transaction sent with hash:', txHash);
        // 保存交易哈希以便返回
        currentTxHash = txHash;
        // 显示交易哈希
        const txHashDisplay = `${t('transactionConfirm.transactionSent')}`;
        showTxStatus(txHashDisplay);
        
        // 为查看回执链接添加事件监听
        document.getElementById('viewReceiptLink')?.addEventListener('click', (e) => {
          e.preventDefault();
          WaitReceipt.show(txHash);
        });
        
        // 显示关闭按钮
        updateButtonsForTx(true);
        
        // 开始轮询交易状态
        this._pollTransactionStatus(txHash, showTxStatus);
      })
      .catch((error) => {
        console.error('Error sending transaction:', error);
        showTxStatus(`${t('transactionConfirm.transactionFailedWithError')}: ${error.message}`, true);
        // 显示关闭按钮
        updateButtonsForTx(true);
      });
    });

    // 存储交易哈希的变量
    let currentTxHash = null;

    // 监听取消和关闭按钮点击事件，用于处理Promise回调
    document.getElementById('cancelBtn')?.addEventListener('click', () => {
      resolvePromise({success: false, action: 'cancelled', txHash: currentTxHash});
    });

    document.getElementById('closeBtn')?.addEventListener('click', () => {
      resolvePromise({success: true, action: 'closed', txHash: currentTxHash});
    });

    // 监听模态框关闭事件
    document.getElementById('transactionConfirmModal')?.addEventListener('hidden.bs.modal', () => {
      resolvePromise({success: false, action: 'dismissed', txHash: currentTxHash});
    });
  }
};

export default TransactionConfirm;