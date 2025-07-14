/**
 * 账户详情视图
 */

import { showToast, shortenAddress } from '../utils.js';
import TransactionConfirm from '../widgets/transaction_confirm.js';
import { currentSigner, isLocalChain } from '../state.js';
import { t } from '../i18n.js';
import WaitReceipt from '../widgets/wait_receipt.js';


/**
 * 获取指定地址的账户详情
 * @param {string} address - 账户地址
 * @returns {Promise} 包含账户详情的Promise
 */
async function fetchAccountDetails(address) {
  try {
    const response = await fetch(`/api/account/${encodeURIComponent(address)}`);
    if (!response.ok) {
      throw new Error(`Network error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching account details:', error);
    showToast('Error', 'Failed to fetch account details: ' + error.message);
    throw error;
  }
}


/**
 * 渲染账户详情视图
 * @param {string} address - 账户地址
 * @returns {string} HTML内容
 */
const AccountItemView = async (address) => {
  if (!address) {
    // 如果没有地址参数，则重定向到账户列表视图
    return null;
  }

  try {
    const data = await fetchAccountDetails(address);

    if (!data.account) {
      return `<div class="alert alert-danger m-5">${t('error.notFound')}: ${address}</div>`;
    }

    const account = data.account;
    const transactions = data.transactions.data.flat().filter(x => x != null);

    return `
      <div class="row mt-4">
        <div class="col-12 mb-4">
          <h2 data-i18n="account.details">账户详情</h2>
          <div class="card">
            <div class="card-body">
              <h5 class="card-title" data-i18n="account.information">账户信息</h5>
              <div class="table-responsive">
                <table class="table">
                  <tbody>
                    <tr>
                      <th scope="row" data-i18n="account.address">地址</th>
                      <td>
                        <div class="d-flex align-items-center">
                          <code class="me-2">${address}</code>
                          <button class="btn btn-sm btn-outline-secondary copy-address" data-address="${address}">
                            <i class="bi bi-clipboard"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th scope="row" data-i18n="account.balance">余额</th>
                      <td>${(parseInt(account.balance) / 1e18).toFixed(6)} ETH</td>
                    </tr>
                    <tr>
                      <th scope="row" data-i18n="account.txCount">交易数</th>
                      <td>${account.transactionCount}</td>
                    </tr>
                    <tr>
                      <th scope="row" data-i18n="account.code">代码</th>
                      <td>${account.code && account.code !== '0x' ? '<span class="badge bg-info" data-i18n="account.contractAccount">合约账户</span>' : '<span class="badge bg-secondary" data-i18n="account.externalAccount">外部账户(EOA)</span>'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 mb-4">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title" data-i18n="account.transfer">转账给他</h5>
              <form id="transferForm" class="mt-3">
                <div class="mb-3">
                  <label for="transferAmount" class="form-label" data-i18n="account.transferAmount">转账金额</label>
                  <div class="input-group">
                    <input type="number" class="form-control" id="transferAmount" min="0" step="any" required data-i18n-placeholder="account.amountPlaceholder" placeholder="输入金额">
                    <select class="form-select" id="transferUnit" style="max-width: 100px;">
                      <option value="ether" selected>ETH</option>
                    </select>
                  </div>
                </div>
                <button class="btn btn-primary" id="transferBtn" data-address="${address}" data-i18n="account.startTransfer">发起转账</button>
              </form>
            </div>
          </div>
        </div>

        ${account.code && account.code !== '0x' ? `
        <div class="col-12 mb-4">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title" data-i18n="account.contractCode">合约代码</h5>
              <textarea class="form-control mt-3 font-monospace" readonly style="height: 200px; font-family: monospace;">${account.code}</textarea>
            </div>
          </div>
        </div>
        ` : ''}

        ${isLocalChain() ? `
        <div class="col-12 mb-4">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title" data-i18n="account.recentTransactions">最近交易</h5>
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th data-i18n="transaction.hash">交易哈希</th>
                      <th data-i18n="transaction.status">类型</th>
                      <th data-i18n="transaction.to">对手方</th>
                      <th data-i18n="transaction.value">值</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${transactions && transactions.length > 0 ? transactions.map(tx => `
                      <tr>
                        <td><a href="/transaction?hash=${tx.hash}" data-link>${shortenAddress(tx.hash)}</a></td>
                        <td>${tx.from.toLowerCase() === address.toLowerCase() ? `<span data-i18n="transaction.sent">发出</span>` : `<span data-i18n="transaction.received">接收</span>`}</td>
                        <td>
                          ${tx.from.toLowerCase() === address.toLowerCase() ?
                            (tx.to ?
                              `<a href="/account?address=${tx.to}" data-link>${shortenAddress(tx.to)}</a>` :
                              `<span data-i18n="transaction.contractCreation">合约创建</span>`) :
                            `<a href="/account?address=${tx.from}" data-link>${shortenAddress(tx.from)}</a>`
                          }
                        </td>
                        <td>${tx.value ? (parseInt(tx.value) / 1e18).toFixed(6) + ' ETH' : '0 ETH'}</td>
                      </tr>
                    `).join('') : '<tr><td colspan="4" class="text-center" data-i18n="transaction.noTransactions">没有找到交易</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        ` : ''}

      </div>
    `;
  } catch (error) {
    console.error('Error rendering account view:', error);
    showToast(t('common.error'), t('error.loadingError'));
    return `<div class="alert alert-danger m-5">${t('error.loadingError')}: ${error.message}</div>`;
  }
};

/**
 * 账户详情视图初始化函数
 */
AccountItemView.init = (address) => {
  // 检查是否提供了地址参数
  if (!address) {
    console.warn('AccountItemView.init called without address parameter');
  }
  
  // 复制地址功能
  document.querySelectorAll('.copy-address').forEach(button => {
    button.addEventListener('click', () => {
      const address = button.getAttribute('data-address');
      navigator.clipboard.writeText(address)
        .then(() => showToast(t('common.success'), t('account.addressCopied')))
        .catch(err => showToast(t('common.error'), t('account.copyFailed') + err));
    });
  });

  // 绑定转账按钮点击事件
  const transferBtn = document.getElementById('transferBtn');
  const transferAmount = document.getElementById('transferAmount');
  
  // 检查输入框是否为空，为空则禁用按钮
  const updateTransferBtnState = () => {
    if (transferBtn && transferAmount) {
      transferBtn.disabled = !transferAmount.value;
    }
  };
  
  // 初始化时检查按钮状态
  updateTransferBtnState();
  
  // 绑定输入框的事件，实时更新按钮状态
  if (transferAmount) {
    transferAmount.addEventListener('input', updateTransferBtnState);
    transferAmount.addEventListener('change', updateTransferBtnState);
  }
  
  if (transferBtn) {
    transferBtn.addEventListener('click', (e)=> {
      e.preventDefault();
      // 获取表单数据
      const targetAddress = transferBtn.getAttribute('data-address');
      const amount = document.getElementById('transferAmount').value;
      const fromAddress = currentSigner().address;

      // 检查当前签名者类型
      if (currentSigner().type === 'wallet') {

        // 确保MetaMask已连接并有权限
        if (!window.ethereum) {
          // TODO:WALLET
          // throw new Error("MetaMask未安装或不可用");
        }

        fetch('/api/prepare-transfer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromAddress,
            to: targetAddress,
            amount: amount // 金额单位为ETH
          })
        })
        .then(response => {
          if (!response.ok) {
            showToast(t('common.error'), t('wallet.prepareFailed') + statusText);
            return;
          }

          response.json().then(data => {
            // 显示转账确认框
            console.log("prepare-transfer response: ", data);
            TransactionConfirm.show(data.txData);
          })
        })
      }
      else  // 测试账户，简化转账操作
      {
        fetch('/api/transfer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromAddress,
            to: targetAddress,
            amount: amount // 金额单位为ETH
          })
        }).then(response => {
          if (response.ok) {
            showToast(t('common.success'), t('wallet.transferSuccess'));
            response.json().then(data => {
              WaitReceipt.show(data.txHash).then(receipt => {
                // 清空输入框
                document.getElementById('transferAmount').value = '';
                updateTransferBtnState();
              });
              console.log('转账成功', data)
            })
          }
          else {
            console.error('转账失败:', response);
          }
        }).catch(error => {
          console.error('转账失败:', error);
          showToast(t('common.error'), t('wallet.transferFailed') + error.message);
        })
      }

    });
  }

};

export default AccountItemView;