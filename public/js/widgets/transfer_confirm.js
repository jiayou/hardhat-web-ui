/**
 * 转账确认组件
 */

import { showToast } from '../utils.js';

/**
 * 转账确认模态框组件
 */
const TransferConfirm = {
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
    // 将十六进制的value转换为ETH显示值
    const valueInWei = parseInt(txData.value, 16);
    const amount = (valueInWei / 1e18).toFixed(6); // 转换为ETH并保留6位小数
    const gas = parseInt(txData.gas, 16);
    const gasPrice = parseInt(txData.gasPrice, 16) / 1e9; // 转换为Gwei
    const nonce = parseInt(txData.nonce, 16);
    const chainId = parseInt(txData.chainId, 16);
    
    console.log("amount", amount)

    // 移除可能存在的旧模态框
    const existingModal = document.getElementById('transferConfirmModal');
    if (existingModal) {
      existingModal.remove();
    }

    // 创建确认对话框
    const confirmModal = `
      <div class="modal fade" id="transferConfirmModal" tabindex="-1" aria-labelledby="transferConfirmModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="transferConfirmModalLabel">确认转账</h5>
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
                    </tr>
                    <tr>
                      <th class="table-light">金额</th>
                      <td><strong id="transferAmount">${amount} ETH</strong></td>
                    </tr>
                    <tr>
                      <th class="table-light">Gas上限</th>
                      <td>${gas}</td>
                    </tr>
                    <tr>
                      <th class="table-light">Gas价格</th>
                      <td>${gasPrice} Gwei</td>
                    </tr>
                    <tr>
                      <th class="table-light">Nonce</th>
                      <td>${nonce}</td>
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
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="cancelBtn">取消</button>
              <button type="button" class="btn btn-danger" id="walletTransferBtn">钱包转账</button>
              <button type="button" class="btn btn-success d-none" id="closeBtn" data-bs-dismiss="modal">关闭</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // 添加模态框到DOM
    document.body.insertAdjacentHTML('beforeend', confirmModal);

    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('transferConfirmModal'));
    modal.show();

    this._setupEventHandlers(modal, txData);
  },

  /**
   * 设置事件处理器
   * @private
   */
  _setupEventHandlers: function(modal, txData) {
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
      const confirmBtn = document.getElementById('confirmTransferBtn');
      if (confirmBtn) confirmBtn.classList.add('d-none');
      const walletBtn = document.getElementById('walletTransferBtn');
      if (walletBtn) walletBtn.classList.add('d-none');

      // 如果需要，显示关闭按钮
      if (showClose) {
        document.getElementById('closeBtn').classList.remove('d-none');
      }
    };


    // 监听钱包转账按钮
    document.getElementById('walletTransferBtn')?.addEventListener('click', () => {
      showTxStatus('请在钱包中确认交易...');

      // 使用MetaMask直接发送交易
      console.log('MetaMask 发起转账，请耐心等待钱包确认');
      window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txData]
      })
      .then((txHash) => {
        console.log('Transaction sent with hash:', txHash);
        // 显示交易哈希
        showTxStatus('交易已发送！交易哈希: ' + txHash);
        showToast('Success', '交易已发送！交易哈希: ' + txHash);
        // 显示关闭按钮
        updateButtonsForTx(true);
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

export default TransferConfirm;