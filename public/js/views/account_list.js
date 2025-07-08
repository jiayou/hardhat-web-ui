/**
 * 账户列表视图
 */

import { showToast, shortenAddress } from '../utils.js';
import { fetchAccounts } from '../api.js';

/**
 * 渲染账户列表视图
 * @returns {string} HTML内容
 */
const AccountListView = async () => {
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
};

/**
 * 账户列表视图初始化函数
 */
AccountListView.init = () => {
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
};

export default AccountListView;
