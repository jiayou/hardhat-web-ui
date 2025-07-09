/**
 * 转账确认组件
 */

import { showToast, shortenAddress } from '../utils.js';

/**
 * 转账确认模态框组件
 */
const TransferConfirm = {
  /**
   * 显示转账确认对话框
   * @param {Object} options - 配置选项
   * @param {string} options.fromAddress - 发送方地址
   * @param {string} options.targetAddress - 接收方地址
   * @param {string} options.amount - 转账金额
   * @param {string} options.unit - 金额单位
   * @param {string} options.valueInHex - 十六进制表示的wei值
   * @param {string} options.signerType - 签名者类型（wallet或其他）
   */
  show: function(options) {
    const { fromAddress, targetAddress, amount, unit, valueInHex, signerType } = options;
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
              <p>您即将从账户 <strong>${shortenAddress(fromAddress)}</strong> 转账到:</p>
              <p>接收地址: <strong>${shortenAddress(targetAddress)}</strong></p>
              <p>金额: <strong id="transferAmount">${amount} ${unit}</strong></p>
              <p>十六进制Wei值: <strong>${valueInHex}</strong></p>
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
              ${signerType === 'wallet' ?
                '<button type="button" class="btn btn-danger" id="walletTransferBtn">钱包转账</button>' :
                '<button type="button" class="btn btn-primary" id="confirmTransferBtn">确认转账</button>'}
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

    this._setupEventHandlers(modal, fromAddress, targetAddress, valueInHex, signerType);
  },

  /**
   * 设置事件处理器
   * @private
   */
  _setupEventHandlers: function(modal, fromAddress, targetAddress, valueInHex, signerType) {
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

    // 通用交易处理函数
    const _handleTransaction = async (executeTransactionFn, initialMessage) => {
      try {
        // 更新UI，显示处理中状态
        showTxStatus(initialMessage);
        updateButtonsForTx();

        // 执行特定的交易逻辑
        const result = await executeTransactionFn();

        // 显示成功消息
        showTxStatus(`${result.successMessage} ${result.transactionHash || ''}`);
        showToast('Success', result.toastMessage);

        // 显示关闭按钮
        updateButtonsForTx(true);

        // 显示交易结果（如果需要）
        if (result.logDetails) {
          console.log(result.logDetails, result);
        }

        // 设置关闭模态框定时器
        setTimeout(() => {
          modal.hide();
          document.getElementById('transferConfirmModal').remove();
          window.location.reload();
        }, 30000);

      } catch (error) {
        console.error(`${error.context || '交易'}出错:`, error);
        showTxStatus(`${error.context || '交易'}出错: ${error.message}`, true);
        showToast('Error', `${error.context || '交易'}出错: ${error.message}`);
        // 显示关闭按钮
        updateButtonsForTx(true);
      }
    };

    // 标准转账的执行函数
    const _executeStandardTransfer = async () => {
      const response = await fetch('/api/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: targetAddress,
          amount: valueInHex, // 使用十六进制wei值
          unit: 'hex' // 标识单位为十六进制
        })
      });

      const result = await response.json();

      if (!response.ok) {
        const error = new Error(result.error || '未知错误');
        error.context = '转账失败';
        throw error;
      }

      return {
        transactionHash: result.transactionHash || '',
        successMessage: '转账成功！交易哈希:',
        toastMessage: '转账成功！'
      };
    };

    // 钱包转账的执行函数
    const _executeWalletTransfer = async () => {
      // 第一步：准备交易数据
      const response = await fetch('/api/prepare-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: targetAddress,
          amount: valueInHex, // 使用十六进制wei值
          unit: 'hex' // 标识单位为十六进制
        })
      });

      const data = await response.json();
      const txData = data.txData;

      // 确保MetaMask已连接并有权限
      if (!window.ethereum) {
        throw new Error("MetaMask未安装或不可用");
      }

      showTxStatus('请在钱包中确认交易...');

      // 使用MetaMask直接发送交易
      console.log('MetaMask 发起转账，请耐心等待钱包确认');
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txData]
      });

      console.log('Transaction sent with hash:', txHash);

      return {
        transactionHash: txHash,
        from: fromAddress,
        to: targetAddress,
        successMessage: '转账已发送！交易哈希:',
        toastMessage: '转账已发送！交易哈希: ' + txHash,
        logDetails: '交易结果:'
      };
    };

    // 监听标准转账按钮点击
    document.getElementById('confirmTransferBtn')?.addEventListener('click', () => {
      _handleTransaction(_executeStandardTransfer, '交易处理中，请稍候...');
    });

    // 监听钱包转账按钮
    document.getElementById('walletTransferBtn')?.addEventListener('click', () => {
      _handleTransaction(_executeWalletTransfer, '准备钱包交易数据，请稍候...');
    });
  }
};

export default TransferConfirm;