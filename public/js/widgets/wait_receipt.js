/**
 * 交易回执模态框组件
 */
const WaitReceipt = {
  /**
   * 显示交易回执对话框并等待交易完成
   * @param {string} txHash - 交易哈希
   * @returns {Promise<object>} - 返回交易回执
   */
  show: async function(txHash) {
    // 重置回执数据和解析函数
    this._currentReceiptData = null;
    this._currentError = null;
    this._currentResolve = null;
    
    // 移除可能存在的旧模态框
    const existingModal = document.getElementById('receiptModal');
    if (existingModal) {
      existingModal.remove();
    }

    // 创建回执对话框
    const receiptModal = `
      <div class="modal fade" id="receiptModal" tabindex="-1" aria-labelledby="receiptModalLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="receiptModalLabel">交易回执</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <h6 class="mb-3">交易哈希: <code>${txHash}</code></h6>
              <div id="receiptContent" class="mt-3">
                <div class="alert alert-info">
                  <div class="d-flex align-items-center">
                    <div class="spinner-border spinner-border-sm me-2" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                    <span id="receiptStatusMessage">正在获取交易回执...</span>
                    <span id="countdownTimer" class="ms-2"></span>
                  </div>
                </div>
              </div>
              <div id="receiptDetails" class="table-responsive d-none">
                <table class="table table-bordered table-sm">
                  <tbody id="receiptTableBody">
                    <!-- 回执详情将在获取到数据后动态填充 -->
                  </tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary d-none" data-bs-dismiss="modal" id="closeBtn">关闭</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // 添加模态框到DOM
    document.body.insertAdjacentHTML('beforeend', receiptModal);

    // 获取所有关闭按钮并添加事件监听
    // 1. 顶部X关闭按钮
    const closeButton = document.querySelector('#receiptModal .btn-close');
    closeButton.addEventListener('click', () => {
      if (this._currentResolve && this._currentReceiptData) {
        this._currentResolve(this._currentReceiptData);
      } else if (this._currentResolve && this._currentError) {
        this._currentResolve(null);
      }
    });
    
    // 2. 底部"关闭"按钮
    const footerCloseBtn = document.getElementById('closeBtn');
    footerCloseBtn.addEventListener('click', () => {
      if (this._currentResolve && this._currentReceiptData) {
        this._currentResolve(this._currentReceiptData);
      } else if (this._currentResolve && this._currentError) {
        this._currentResolve(null);
      }
    });

    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('receiptModal'), {
      backdrop: 'static',
      keyboard: false
    });
    modal.show();

    return this._fetchReceiptData(txHash);
  },

  /**
   * 获取交易回执数据
   * @param {string} txHash - 交易哈希
   * @returns {Promise<object>} - 返回交易回执
   * @private
   */
  _fetchReceiptData: function(txHash) {
    return new Promise((resolve, reject) => {
      // 保存resolve函数，用于关闭按钮点击时调用
      this._currentResolve = resolve;
    let countdown = 10;
    let countdownInterval;
    const statusMessageEl = document.getElementById('receiptStatusMessage');
    const countdownEl = document.getElementById('countdownTimer');
    const closeBtn = document.getElementById('closeBtn');

    // 更新UI显示交易状态
    const updateReceiptStatus = (message, type = 'info') => {
      const alertElement = document.querySelector('#receiptContent .alert');

      // 移除所有可能的状态类
      alertElement.classList.remove('alert-info', 'alert-success', 'alert-danger');

      // 添加新的状态类
      alertElement.classList.add(`alert-${type}`);

      // 更新消息
      statusMessageEl.textContent = message;

      // 如果交易完成或失败，显示关闭按钮
      if (type === 'success' || type === 'danger') {
        closeBtn.classList.remove('d-none');

        // 清除倒计时
        if (countdownInterval) {
          clearInterval(countdownInterval);
          countdownEl.textContent = '';
        }
        
        // 更新状态图标
        const statusIconContainer = document.querySelector('#receiptContent .alert .d-flex div:first-child');
        if (statusIconContainer) {
          if (type === 'success') {
            // 替换成功图标
            statusIconContainer.classList.remove('spinner-border');
            statusIconContainer.innerHTML = '<i class="bi bi-check-circle-fill text-success me-2" style="font-size: 1.2rem;"></i>';
          } else if (type === 'danger') {
            // 替换失败图标
            statusIconContainer.classList.remove('spinner-border');
            statusIconContainer.innerHTML = '<i class="bi bi-exclamation-circle-fill text-danger me-2" style="font-size: 1.2rem;"></i>';
          }
        }
      }
    };

    // 显示回执详情
    const displayReceiptDetails = (receipt) => {
      const receiptDetails = document.getElementById('receiptDetails');
      const tableBody = document.getElementById('receiptTableBody');

      // 清空现有内容
      tableBody.innerHTML = '';

      // 构建表格行
      const rows = [
        { label: '发送地址', value: receipt.from },
        { label: '接收地址', value: receipt.to },
        { label: '交易哈希', value: receipt.hash },
        { label: '区块哈希', value: receipt.blockHash },
        { label: '区块号', value: receipt.blockNumber },
        { label: '交易索引', value: receipt.index },
        { label: '使用Gas', value: receipt.gasUsed },
        { label: '累计Gas用量', value: receipt.cumulativeGasUsed },
        { label: 'Gas价格', value: receipt.gasPrice },
        { label: '交易类型', value: receipt.type },
        { label: '状态', value: receipt.status === 1 ? '成功' : '失败' }
      ];

      // 添加行到表格
      rows.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <th class="table-light" style="width: 40%">${row.label}</th>
          <td style="word-break: break-all;"><code>${row.value}</code></td>
        `;
        tableBody.appendChild(tr);
      });

      // 显示详情区域
      receiptDetails.classList.remove('d-none');
    };

    // 获取交易回执的函数
    const fetchReceipt = () => {
      fetch(`/api/transaction/${txHash}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (data.receipt) {
            // 有回执，显示详情
            // console.log('Receipt data:', data.receipt);

            // 判断交易状态并更新UI
            if (data.receipt.status === 1) {
              updateReceiptStatus('交易成功！', 'success');
            } else {
              updateReceiptStatus('交易失败！', 'danger');
            }

            // 显示回执详情
            displayReceiptDetails(data.receipt);

            // 清除倒计时
            if (countdownInterval) {
              clearInterval(countdownInterval);
              countdownEl.textContent = '';
            }
            
            // 保存回执数据，等待用户点击关闭按钮
            this._currentReceiptData = data.receipt;
          } else {
            // 没有回执，开始倒计时
            if (!countdownInterval) {
              updateReceiptStatus('等待交易确认中...');

              // 启动倒计时
              countdownInterval = setInterval(() => {
                countdownEl.textContent = `(${countdown}秒后重试)`;
                countdown--;

                if (countdown < 0) {
                  countdown = 10;
                  countdownEl.textContent = '';
                  statusMessageEl.textContent = '正在重新获取交易回执...';
                  fetchReceipt();
                }
              }, 1000);
            }
          }
        })
        .catch(error => {
          console.error('Error fetching transaction receipt:', error);
          updateReceiptStatus(`获取回执失败: ${error.message}`, 'danger');
          closeBtn.classList.remove('d-none');

          // 清除倒计时
          if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownEl.textContent = '';
          }
          
          // 在错误情况下，仍然需要等待用户点击关闭按钮
          this._currentError = error;
        });
    };

    // 首次获取回执
    fetchReceipt();
    });
  }
};

export default WaitReceipt;
