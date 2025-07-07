/**
 * 账户详情视图
 */

import { showToast, shortenAddress } from '../utils.js';
import { fetchAccounts, fetchAccountDetails } from '../api.js';
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
          <div class="alert alert-warning">请指定账户地址</div>
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

        ${account.code && account.code !== '0x' ? `
        <div class="col-12 mb-4">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">合约代码</h5>
              <pre class="mt-3"><code>${account.code}</code></pre>
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
                <h6 class="mb-1">${shortenAddress(account.address)}</h6>
                <span class="badge bg-primary rounded-pill">${(parseInt(account.balance) / 1e18).toFixed(4)} ETH</span>
              </div>
              <small class="text-muted">${account.transactionCount || 0} 交易</small>
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
  
  // 高亮代码
  document.querySelectorAll('pre code').forEach((block) => {
    if (window.hljs) {
      window.hljs.highlightElement(block);
    }
  });
};

// 导出默认视图函数
export default AccountView;