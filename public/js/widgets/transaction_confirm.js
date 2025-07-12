/**
 * 转账确认组件
 */

import { showToast } from '../utils.js';
import WaitReceipt from './wait_receipt.js'
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
              <h5 class="modal-title" id="transactionConfirmModalLabel">确认交易</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <h6 class="mb-3">您即将确认以下交易：</h6>
              <div class="table-responsive">
                <table class="table table-bordered table-sm">
                  <tbody>
                    <tr>
                      <th class="table-light" style="width: 25%">发送地址</th>
                      <td><code>${fromAddress}</code></td>
                    </tr>
                    <tr>
                      <th class="table-light">接收地址</th>
                      <td><code>${targetAddress}</code></td>
                    </tr>`;
    
    // 只有当txData中存在value字段且解析出了金额时才显示金额行
    if (amount !== undefined) {
      modalBody += `
                    <tr>
                      <th class="table-light">金额</th>
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
                      <th class="table-light">数据</th>
                      <td>${dataBytes} 字节</td>
                    </tr>`;
    }
    
    // 添加其余表格行
    modalBody += `
                    <tr>
                      <th class="table-light">Gas价格</th>
                      <td>${gasPrice} Gwei</td>
                    </tr>
                    <tr>
                      <th class="table-light">Gas上限</th>
                      <td>
                        <div class="input-group">
                          <input type="number" class="form-control form-control-sm" id="gasInput" value="${gas}">
                          <button class="btn btn-outline-secondary btn-sm" type="button" id="resetGasBtn" title="还原原值">
                            <i class="bi bi-arrow-counterclockwise"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th class="table-light">Nonce</th>
                      <td>
                        <div class="input-group">
                          <input type="number" class="form-control form-control-sm" id="nonceInput" value="${nonce}">
                          <button class="btn btn-outline-secondary btn-sm" type="button" id="resetNonceBtn" title="还原原值">
                            <i class="bi bi-arrow-counterclockwise"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th class="table-light">链ID</th>
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
                    <span id="txStatusMessage">交易处理中...</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer" id="modalButtons">
              <div class="me-auto">
                <small class="text-muted">费用预估: <span id="feeEstimate">0.0000 ETH</span></small>
              </div>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="cancelBtn">取消</button>
              <button type="button" class="btn btn-danger" id="walletTransactionBtn">钱包交易</button>
              <button type="button" class="btn btn-success d-none" id="closeBtn" data-bs-dismiss="modal">关闭</button>
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

    this._setupEventHandlers(modal, txData);
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
              txStatusElem.innerHTML = `交易成功! <a href="#" id="viewReceiptLink2" class="text-primary">查看回执</a>`;
              
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
              txStatusElem.innerHTML = `交易失败! <a href="#" id="viewReceiptLink2" class="text-primary">查看回执</a>`;
              
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
              txStatusElem.textContent = `交易处理时间过长，请稍后查看状态`;
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
  
  _setupEventHandlers: function(modal, txData) {
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
      showTxStatus('请在钱包中确认交易...');

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
        // 显示交易哈希
        const txHashDisplay = `<div>交易已发送！交易哈希: ${txHash} <a href="#" id="viewReceiptLink" class="text-primary ms-2">查看回执</a></div>`;
        showTxStatus(txHashDisplay);
        showToast('Success', '交易已发送！交易哈希: ' + txHash);
        
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
        showTxStatus('交易失败: ' + error.message, true);
        showToast('Error', '交易失败: ' + error.message);
        // 显示关闭按钮
        updateButtonsForTx(true);
      });
    });

  }
};

export default TransactionConfirm;