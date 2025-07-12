/**
 * 交易列表视图
 */

import { showToast, formatDateTime, shortenAddress, copyToClipboard } from '../utils.js';
import TransactionItemView from './transaction_item.js';

/**
 * 渲染交易列表视图
 * @returns {string} HTML内容
 */
const TransactionListView = async () => {
  try {
    // fetch /api/transaction?blockNum=&batchSize=10&fields=hash,from,to,value,gasPrice,gasLimit,nonce,blockNumber
    const response = await fetch('/api/transaction?batchSize=10&fields=hash,from,to,value,gasPrice,gasLimit,nonce,blockNumber');
    const result = await response.json();

    // { nextBlock: 13, data: [[...]]}
    const flattenData = result.data.flat();
    const nextBlock = result.nextBlock;

    // 表格显示flattenData
    return `
      <div class="row mt-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center">
            <h2>最近交易</h2>
            <div>
              <form id="txSearchForm" class="mt-3">
                <div class="input-group mb-3">
                  <input type="text" class="form-control" placeholder="输入交易哈希" id="txHashInput">
                  <button class="btn btn-primary" type="submit">查询</button>
                </div>
              </form>
            </div>
          </div>
          <div class="card">
            <div class="card-body">
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th scope="col">交易哈希</th>
                    <th scope="col">发送方</th>
                    <th scope="col">接收方</th>
                    <th scope="col">金额</th>
                    <th scope="col">Gas Price</th>
                    <th scope="col">Gas Limit</th>
                    <th scope="col">Nonce</th>
                    <th scope="col">区块</th>
                  </tr>
                </thead>
                <tbody>
                  ${flattenData.map(tx => `
                    <tr>
                      <td><a href="/transaction?hash=${tx.hash}" data-link>${shortenAddress(tx.hash)}</a> <button class="btn btn-sm btn-outline-secondary copy-btn" data-copy="${tx.hash}"><i class="bi bi-clipboard"></i></button></td>
                      <td><a href="/account?address=${tx.from}" data-link>${shortenAddress(tx.from)}</a> <button class="btn btn-sm btn-outline-secondary copy-btn" data-copy="${tx.from}"><i class="bi bi-clipboard"></i></button></td>
                      <td>${tx.to ? `<a href="/account?address=${tx.to}" data-link>${shortenAddress(tx.to)}</a> <button class="btn btn-sm btn-outline-secondary copy-btn" data-copy="${tx.to}"><i class="bi bi-clipboard"></i></button>` : '<span class="badge bg-info">合约创建</span>'}</td>
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
                <button id="loadMoreTxBtn" class="btn btn-outline-primary" data-next-block="${nextBlock}">加载更多</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error rendering transaction list view:', error);
    showToast('Error', 'Failed to load transaction list data');
    return `<div class="alert alert-danger m-5">Failed to load transaction list data: ${error.message}</div>`;
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
        showToast('成功', '已复制到剪贴板');
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
          const response = await fetch(`/api/transaction?blockNum=${nextBlock}&batchSize=10&fields=hash,from,to,value,gasPrice,gasLimit,nonce,blockNumber`);
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
                <td>${tx.to ? `<a href="/account?address=${tx.to}" data-link>${shortenAddress(tx.to)}</a> <button class="btn btn-sm btn-outline-secondary copy-btn" data-copy="${tx.to}"><i class="bi bi-clipboard"></i></button>` : '<span class="badge bg-info">合约创建</span>'}</td>
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
            showToast('提示', '没有更多交易数据');
          }
        } catch (error) {
          console.error('Error loading more transactions:', error);
          showToast('Error', 'Failed to load more transactions');
        }
      }
    });
  }
};

// 导出默认视图函数
export default TransactionListView;