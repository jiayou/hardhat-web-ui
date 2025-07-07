/**
 * 账户详情视图
 */

import { showToast, shortenAddress } from '../utils.js';
import { fetchAccounts, fetchAccountDetails } from '../api.js';
import { currentSigner } from '../state.js';
/**
 * 渲染账户详情视图
 * @returns {string} HTML内容
 */
const AccountView = async () => {
  const params = new URLSearchParams(window.location.search);
  const address = params.get('address');
  
  if (!address) {
    return `
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">账户查询</h5>
              <form id="accountSearchForm" class="mt-3">
                <div class="input-group mb-3">
                  <input type="text" class="form-control" placeholder="输入账户地址" id="addressInput">
                  <button class="btn btn-primary" type="submit">查询</button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div class="col-12 mt-4">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">常用账户</h5>
              <div id="accountList" class="list-group mt-3">
                <div class="text-center">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  try {
    const data = await fetchAccountDetails(address);
    // console.log(data);

    if (!data.account) {
      return `<div class="alert alert-danger m-5">账户 ${address} 未找到或网络错误</div>`;
    }

    const account = data.account;

    const transactions = data.transactions.data.flat().filter(x=> x!=null);
    console.log(transactions);
    
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
                        <td><a href="/tx?hash=${tx.hash}" data-link>${shortenAddress(tx.hash)}</a></td>
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
 * 账户视图初始化函数
 */
AccountView.init = () => {
  // 账户搜索表单处理
  const accountSearchForm = document.getElementById('accountSearchForm');
  if (accountSearchForm) {
    accountSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const address = document.getElementById('addressInput').value.trim();
      if (address) {
        window.location.href = `/account?address=${address}`;
      }
    });
  }
  
  // 加载账户列表
  const accountList = document.getElementById('accountList');
  if (accountList) {
    // 获取常用账户列表
    fetchAccounts().then(data => {
      // API 返回的数据格式为 { accounts: [...] }
      const accounts = data.accounts || [];
      if (accounts.length > 0) {
        accountList.innerHTML = accounts
          .map(account => `
            <a href="/account?address=${account.address}" class="list-group-item list-group-item-action">
              <div class="d-flex w-100 justify-content-between">
                <code style="overflow-x: auto; display: inline-block; min-width: 400px;">${account.address}</code>
                <span class="badge bg-primary rounded-pill">${(parseInt(account.balance) / 1e18).toFixed(4)} ETH</span>
              </div>
            </a>
          `)
          .join('');
      } else {
        accountList.innerHTML = '<div class="alert alert-light">无可用账户</div>';
      }
    }).catch(error => {
      console.error('Failed to load account list', error);
      accountList.innerHTML = '<div class="alert alert-danger">加载账户列表失败</div>';
    });
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
      const fromAddress = currentSigner();
      
      if (!fromAddress) {
        showToast('Error', '请先连接钱包');
        return;
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
                <p>金额: <strong>${amount} ${unit}</strong></p>
                <p>十六进制Wei值: <strong>${valueInHex}</strong></p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                <button type="button" class="btn btn-primary" id="confirmTransferBtn">确认转账</button>
                <button type="button" class="btn btn-danger"  id="walletTransferBtn">钱包转账</button>
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
      
      // 监听确认按钮
      document.getElementById('confirmTransferBtn').addEventListener('click', async () => {
        try {
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
          
          if (response.ok) {
            modal.hide();
            showToast('Success', '转账成功！');
            // 移除模态框
            document.getElementById('transferConfirmModal').remove();
            // 刷新页面
            setTimeout(() => window.location.reload(), 1500);
          } else {
            showToast('Error', `转账失败: ${result.error || '未知错误'}`);
          }
        } catch (error) {
          console.error('转账出错:', error);
          showToast('Error', `转账出错: ${error.message}`);
        }
      });

      document.getElementById('walletTransferBtn').addEventListener('click', async () => {
        try {

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

          // 第二步：使用获取到的txData进行钱包签名
          const signedTx = await window.ethereum.request({
            method: 'eth_signTransaction',
            params: [txData]
          });

          // 第三步：将签名后的交易发送回后端
          const result = await api.post('/wallet_transfer', {
            signedTx,
            from: userWalletAddress,
            to: recipientAddress
          });
          
          // 如果成功，显示成功消息
          modal.hide();
          showToast('Success', '转账已发送！交易哈希: ' + result.data.transactionHash);
          
          // 显示交易结果
          console.log('交易结果:', result);
          
          // 刷新页面
          setTimeout(() => window.location.reload(), 1500);

        } catch (error) {
          console.error('交易出错:', error);
        }
      })
    });
  }
  
  // 高亮代码
  document.querySelectorAll('pre code').forEach((block) => {
    if (window.hljs) {
      window.hljs.highlightElement(block);
    }
  });
};

// 导出默认视图函数
export default AccountView;