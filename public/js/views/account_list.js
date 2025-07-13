/**
 * 账户列表视图
 */

import { showToast, shortenAddress } from '../utils.js';
import { t } from '../i18n.js';

/**
 * 获取账户列表
 */
async function fetchAccounts() {
  try {
    const response = await fetch('/api/account');
    if (!response.ok) {
      throw new Error(`Network error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`${t('account.fetchError')}:`, error);
    showToast(t('common.error'), t('account.fetchError'));
    throw error;
  }
}


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
            <h5 class="card-title">${t('account.search')}</h5>
            <form id="accountSearchForm" class="mt-3">
              <div class="input-group mb-3">
                <input type="text" class="form-control" placeholder="${t('account.inputAddress')}" id="addressInput">
                <button class="btn btn-primary" type="submit">${t('common.search')}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div class="col-12 mt-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="card-title">${t('account.commonAccounts')}</h5>
        </div>
        <div class="card">
          <div class="card-body">
            <div id="accountList" class="list-group mt-3">
              <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">${t('common.loading')}</span>
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
        accountList.innerHTML = `<div class="alert alert-light">${t('account.noAccounts')}</div>`;
      }
    }).catch(error => {
      console.error(`${t('account.loadFailed')}:`, error);
      accountList.innerHTML = `<div class="alert alert-danger">${t('account.loadFailed')}</div>`;
    });
  }
};

export default AccountListView;
