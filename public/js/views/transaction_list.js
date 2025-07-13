/**
 * 交易列表视图
 */

import { showToast, formatDateTime, shortenAddress, copyToClipboard } from '../utils.js';
import TransactionItemView from './transaction_item.js';
import { t } from '../i18n.js';

/**
 * 渲染交易列表视图
 * @returns {string} HTML内容
 */
const TransactionListView = async () => {
  try {
    const response = await fetch('/api/transaction?fields=hash,from,to,value,gasPrice,gasLimit,nonce,blockNumber');
    const result = await response.json();

    // { nextBlock: 13, data: [[...]]}
    const flattenData = result.data.flat();
    const nextBlock = result.nextBlock;

    // 表格显示flattenData
    return `
      <div class="row mt-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center">
            <h2>${t('transaction.list')}</h2>
            <div>
              <form id="txSearchForm" class="mt-3">
                <div class="input-group mb-3">
                  <input type="text" class="form-control" placeholder="${t('transaction.inputHash')}" id="txHashInput">
                  <button class="btn btn-primary" type="submit">${t('transaction.search')}</button>
                </div>
              </form>
            </div>
          </div>
          <div class="card">
            <div class="card-body">
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th scope="col">${t('transaction.hash')}</th>
                    <th scope="col">${t('transaction.from')}</th>
                    <th scope="col">${t('transaction.to')}</th>
                    <th scope="col">${t('transaction.value')}</th>
                    <th scope="col">${t('transaction.gasPrice')}</th>
                    <th scope="col">${t('transaction.gasLimit')}</th>
                    <th scope="col">${t('transaction.nonce')}</th>
                    <th scope="col">${t('block.number')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${flattenData.map(tx => `
                    <tr>
                      <td><a href="/transaction?hash=${tx.hash}" data-link>${shortenAddress(tx.hash)}</a> <button class="btn btn-sm btn-outline-secondary copy-btn" data-copy="${tx.hash}"><i class="bi bi-clipboard"></i></button></td>
                      <td><a href="/account?address=${tx.from}" data-link>${shortenAddress(tx.from)}</a> <button class="btn btn-sm btn-outline-secondary copy-btn" data-copy="${tx.from}"><i class="bi bi-clipboard"></i></button></td>
                      <td>${tx.to ? `<a href="/account?address=${tx.to}" data-link>${shortenAddress(tx.to)}</a> <button class="btn btn-sm btn-outline-secondary copy-btn" data-copy="${tx.to}"><i class="bi bi-clipboard"></i></button>` : `<span class="badge bg-info">${t('transaction.contractCreation')}</span>`}</td>
                      <td>${tx.value ? (parseInt(tx.value) / 1e18).toFixed(6) + ' ETH' : '0 ETH'}</td>
                      <td>${tx.gasPrice ? (parseInt(tx.gasPrice) / 1e9) + ' Gwei' : 'N/A'}</td>
                      <td>${tx.gasLimit}</td>
                      <td>${tx.nonce}</td>
                      <td><a href="/block?number=${tx.blockNumber}" data-link>${tx.blockNumber}</a></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="d-flex justify-content-center mt-3">
                <button id="loadMoreTxBtn" class="btn btn-outline-primary" data-next-block="${nextBlock}">${t('transaction.loadMore')}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error(`${t('error.loadingError')}: ${error}`);
    showToast(t('common.error'), t('transaction.noTransactions'));
    return `<div class="alert alert-danger m-5">${t('transaction.noTransactions')}: ${error.message}</div>`;
  }
};

/**
 * 交易列表视图初始化函数
 */
TransactionListView.init = () => {
  // 复制按钮事件委托
  document.addEventListener('click', (e) => {
    if (e.target.closest('.copy-btn')) {
      const btn = e.target.closest('.copy-btn');
      const textToCopy = btn.getAttribute('data-copy');
      if (textToCopy) {
        copyToClipboard(textToCopy);
        showToast(t('common.success'), t('transaction.copySuccess'));
      }
    }
  });

  // 交易搜索表单处理
  const txSearchForm = document.getElementById('txSearchForm');
  if (txSearchForm) {
    txSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const txHash = document.getElementById('txHashInput').value.trim();
      if (txHash) {
        window.location.href = `/transaction?hash=${txHash}`;
      }
    });
  }

  // 刷新按钮处理
  const refreshTxBtn = document.getElementById('refreshTxBtn');
  if (refreshTxBtn) {
    refreshTxBtn.addEventListener('click', () => {
      // 刷新交易列表的处理函数
      window.location.reload();
    });
  }

  // 加载更多按钮处理
  const loadMoreTxBtn = document.getElementById('loadMoreTxBtn');
  if (loadMoreTxBtn) {
    loadMoreTxBtn.addEventListener('click', async (e) => {
      const nextBlock = e.target.getAttribute('data-next-block');
      if (nextBlock) {
        try {
          const response = await fetch(`/api/transaction?blockNum=${nextBlock}&fields=hash,from,to,value,gasPrice,gasLimit,nonce,blockNumber`);
          const result = await response.json();

          if (result.data && result.data.length > 0) {
            const flattenData = result.data.flat();
            const tbody = document.querySelector('table tbody');

            // 添加新行到表格
            flattenData.forEach(tx => {
              const row = document.createElement('tr');
              row.innerHTML = `
                <td><a href="/transaction?hash=${tx.hash}" data-link>${shortenAddress(tx.hash)}</a> <button class="btn btn-sm btn-outline-secondary copy-btn" data-copy="${tx.hash}"><i class="bi bi-clipboard"></i></button></td>
                <td><a href="/account?address=${tx.from}" data-link>${shortenAddress(tx.from)}</a> <button class="btn btn-sm btn-outline-secondary copy-btn" data-copy="${tx.from}"><i class="bi bi-clipboard"></i></button></td>
                <td>${tx.to ? `<a href="/account?address=${tx.to}" data-link>${shortenAddress(tx.to)}</a> <button class="btn btn-sm btn-outline-secondary copy-btn" data-copy="${tx.to}"><i class="bi bi-clipboard"></i></button>` : `<span class="badge bg-info">${t('transaction.contractCreation')}</span>`}</td>
                <td>${tx.value ? (parseInt(tx.value) / 1e18).toFixed(6) + ' ETH' : '0 ETH'}</td>
                <td>${tx.gasPrice ? (parseInt(tx.gasPrice) / 1e9) + ' Gwei' : 'N/A'}</td>
                <td>${tx.gasLimit}</td>
                <td>${tx.nonce}</td>
                <td><a href="/block?number=${tx.blockNumber}" data-link>${tx.blockNumber}</a></td>
              `;
              tbody.appendChild(row);
            });

            // 更新按钮的nextBlock属性
            loadMoreTxBtn.setAttribute('data-next-block', result.nextBlock);
          } else {
            // 没有更多数据时隐藏按钮
            loadMoreTxBtn.classList.add('d-none');
            showToast(t('transaction.hint'), t('transaction.noMoreTransactions'));
          }
        } catch (error) {
          console.error(`${t('error.loadingError')}: ${error}`);
          showToast(t('common.error'), t('transaction.loadMoreFailed'));
        }
      }
    });
  }
};

// 导出默认视图函数
export default TransactionListView;