/**
 * 账户详情视图
 */

import { showToast, shortenAddress } from '../utils.js';
import { fetchAccountDetails } from '../api.js';
import TransferConfirm from '../widgets/transfer_confirm.js';
import { currentSigner } from '../state.js';

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
      return `<div class="alert alert-danger m-5">账户 ${address} 未找到或网络错误</div>`;
    }

    const account = data.account;
    const transactions = data.transactions.data.flat().filter(x => x != null);

    return `
      <div class="row mt-4">
        <div class="col-12 mb-4">
          <h2>账户详情</h2>
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">账户信息</h5>
              <div class="table-responsive">
                <table class="table">
                  <tbody>
                    <tr>
                      <th scope="row">地址</th>
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
                      <th scope="row">余额</th>
                      <td>${(parseInt(account.balance) / 1e18).toFixed(6)} ETH</td>
                    </tr>
                    <tr>
                      <th scope="row">交易数</th>
                      <td>${account.transactionCount}</td>
                    </tr>
                    <tr>
                      <th scope="row">代码</th>
                      <td>${account.code && account.code !== '0x' ? '<span class="badge bg-info">合约账户</span>' : '<span class="badge bg-secondary">外部账户(EOA)</span>'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        ${account.code && account.code !== '0x' ? '' : `
        <div class="col-12 mb-4">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">转账给他</h5>
              <form id="transferForm" class="mt-3">
                <div class="mb-3">
                  <label for="transferAmount" class="form-label">转账金额</label>
                  <div class="input-group">
                    <input type="number" class="form-control" id="transferAmount" min="0" step="any" required placeholder="输入金额">
                    <select class="form-select" id="transferUnit" style="max-width: 100px;">
                      <option value="wei">Wei</option>
                      <option value="gwei">Gwei</option>
                      <option value="ether" selected>ETH</option>
                    </select>
                  </div>
                </div>
                <button type="submit" class="btn btn-primary" id="transferBtn" data-address="${address}">转账</button>
              </form>
            </div>
          </div>
        </div>
        `}

        ${account.code && account.code !== '0x' ? `
        <div class="col-12 mb-4">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">合约代码</h5>
              <textarea class="form-control mt-3 font-monospace" readonly style="height: 200px; font-family: monospace;">${account.code}</textarea>
            </div>
          </div>
        </div>
        ` : ''}

        <div class="col-12 mb-4">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">最近交易</h5>
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>交易哈希</th>
                      <th>类型</th>
                      <th>对手方</th>
                      <th>值</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${transactions && transactions.length > 0 ? transactions.map(tx => `
                      <tr>
                        <td><a href="/transaction?hash=${tx.hash}" data-link>${shortenAddress(tx.hash)}</a></td>
                        <td>${tx.from.toLowerCase() === address.toLowerCase() ? '发出' : '接收'}</td>
                        <td>
                          ${tx.from.toLowerCase() === address.toLowerCase() ?
                            (tx.to ?
                              `<a href="/account?address=${tx.to}" data-link>${shortenAddress(tx.to)}</a>` :
                              '合约创建') :
                            `<a href="/account?address=${tx.from}" data-link>${shortenAddress(tx.from)}</a>`
                          }
                        </td>
                        <td>${tx.value ? (parseInt(tx.value) / 1e18).toFixed(6) + ' ETH' : '0 ETH'}</td>
                      </tr>
                    `).join('') : '<tr><td colspan="4" class="text-center">No transactions found</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error rendering account view:', error);
    showToast('Error', 'Failed to load account data');
    return `<div class="alert alert-danger m-5">Failed to load account data: ${error.message}</div>`;
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
        .then(() => showToast('Success', '地址已复制到剪贴板'))
        .catch(err => showToast('Error', '复制失败: ' + err));
    });
  });

  // 处理转账表单
  const transferForm = document.getElementById('transferForm');
  if (transferForm) {
    transferForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // 获取表单数据
      const targetAddress = transferForm.querySelector('#transferBtn').getAttribute('data-address');
      const amount = document.getElementById('transferAmount').value;
      const unit = document.getElementById('transferUnit').value;

      // 将金额转换为wei
      let valueInWei;
      switch(unit) {
        case 'wei':
          valueInWei = amount;
          break;
        case 'gwei':
          valueInWei = amount * 1e9;
          break;
        case 'ether':
          valueInWei = amount * 1e18;
          break;
        default:
          valueInWei = amount * 1e18; // 默认使用ETH
      }

      // 转换为十六进制
      const valueInHex = '0x' + parseInt(valueInWei).toString(16);

      // 获取当前签名者地址
      const fromAddress = currentSigner().address;

      if (!fromAddress) {
        showToast('Error', '请先连接钱包');
        return;
      }

      // 检查当前签名者类型
      const signerType = currentSigner().type || 'hardhat';

      // 显示转账确认框
      TransferConfirm.show({
        fromAddress,
        targetAddress,
        amount,
        unit,
        valueInHex,
        signerType
      });
    });
  }

  // 高亮代码
  document.querySelectorAll('pre code').forEach((block) => {
    if (window.hljs) {
      window.hljs.highlightElement(block);
    }
  });
};

export default AccountItemView;