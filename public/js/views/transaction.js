/**
 * 交易详情视图
 */

import { showToast, formatDateTime, shortenAddress } from '../utils.js';

/**
 * 渲染交易详情视图
 * @returns {string} HTML内容
 */
const TransactionView = async () => {
  const params = new URLSearchParams(window.location.search);
  const txHash = params.get('hash');
  
  // 显示最近交易列表
  if (!txHash) {

    // fetch /api/tx?blockNum=&batchSize=10&fields=hash,from,to,value,gasPrice,gasLimit,nonce,blockNumber
    const response = await fetch('/api/tx?batchSize=10&fields=hash,from,to,value,gasPrice,gasLimit,nonce,blockNumber');
    const result = await response.json();

    // { nextBlock: 13, data: [[...]]}
    const flattenData = result.data.flat();
    const nextBlock = result.nextBlock;

    // 表格显示flattenData
    // [
    //   {"hash":"0xa02bafb08af6942051c5b031f7d17f9db64cd9f8275852ec1a1eae79b1941f1c","from":"0x2546BcD3c84621e976D8185a91A922aE77ECEc30","to":"0xd0F350b13465B5251bb03E4bbf9Fa1DbC4a378F3","value":"0","gasPrice":"302099417","gasLimit":"30000000","nonce":1,"blockNumber":11}
    //   ...
    // ]
    return `
      <div class="row mt-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center">
            <h2>最近交易</h2>
            <button id="refreshTxBtn" class="btn btn-outline-primary"><i class="bi bi-arrow-clockwise"></i> 刷新</button>
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
                      <td><a href="/tx?hash=${tx.hash}" data-link>${shortenAddress(tx.hash)}</a></td>
                      <td><a href="/account?address=${tx.from}" data-link>${shortenAddress(tx.from)}</a></td>
                      <td>${tx.to ? `<a href="/account?address=${tx.to}" data-link>${shortenAddress(tx.to)}</a>` : '<span class="badge bg-info">合约创建</span>'}</td>
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
  }

  try {
    const response = await fetch(`/api/tx/${txHash}`);
    const data = await response.json();

    if (!data.transaction) {
      return `<div class="alert alert-danger m-5">交易 ${txHash} 未找到</div>`;
    }

    const tx = data.transaction;
    const receipt = data.receipt;
    
    return `
      <div class="row mt-4">
        <div class="col-12 mb-4">
          <h2>交易详情</h2>
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">交易信息</h5>
              <div class="table-responsive">
                <table class="table">
                  <tbody>
                    <tr>
                      <th scope="row">交易哈希</th>
                      <td><code>${tx.hash}</code></td>
                    </tr>
                    <tr>
                      <th scope="row">区块</th>
                      <td>
                        ${receipt?.blockNumber ? 
                          `<a href="/block?number=${receipt.blockNumber}" data-link>${receipt.blockNumber}</a>` : 
                          '待确认'}
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">发送方</th>
                      <td>
                        <a href="/account?address=${tx.from}" data-link>${tx.from}</a>
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">接收方</th>
                      <td>
                        ${tx.to ? 
                          `<a href="/account?address=${tx.to}" data-link>${tx.to}</a>` : 
                          '<span class="badge bg-info">合约创建</span>'}
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">值</th>
                      <td>${tx.value ? (parseInt(tx.value) / 1e18).toFixed(6) + ' ETH' : '0 ETH'}</td>
                    </tr>
                    <tr>
                      <th scope="row">Gas Price</th>
                      <td>${tx.gasPrice ? (parseInt(tx.gasPrice) / 1e9) + ' Gwei' : 'N/A'}</td>
                    </tr>
                    <tr>
                      <th scope="row">Gas Limit</th>
                      <td>${parseInt(tx.gas)}</td>
                    </tr>
                    <tr>
                      <th scope="row">状态</th>
                      <td>
                        ${receipt ? 
                          (receipt.status ? 
                            '<span class="badge bg-success">成功</span>' : 
                            '<span class="badge bg-danger">失败</span>') : 
                          '<span class="badge bg-warning">待处理</span>'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        ${receipt?.logs && receipt.logs.length > 0 ? `
        <div class="col-12 mb-4">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">事件日志</h5>
              <div class="accordion" id="eventLogsAccordion">
                ${receipt.logs.map((log, index) => `
                  <div class="accordion-item">
                    <h2 class="accordion-header" id="heading${index}">
                      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${index}">
                        日志 #${index} - 地址: ${shortenAddress(log.address)}
                      </button>
                    </h2>
                    <div id="collapse${index}" class="accordion-collapse collapse" data-bs-parent="#eventLogsAccordion">
                      <div class="accordion-body">
                        <pre><code>${JSON.stringify(log, null, 2)}</code></pre>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
        ` : ''}

        <div class="col-12 mb-4">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">输入数据</h5>
              <pre class="mt-3"><code>${tx.input === '0x' ? '(无数据)' : tx.input}</code></pre>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error rendering transaction view:', error);
    showToast('Error', 'Failed to load transaction data');
    return `<div class="alert alert-danger m-5">Failed to load transaction data: ${error.message}</div>`;
  }
};

/**
 * 交易视图初始化函数
 */
TransactionView.init = () => {
  // 交易搜索表单处理
  const txSearchForm = document.getElementById('txSearchForm');
  if (txSearchForm) {
    txSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const txHash = document.getElementById('txHashInput').value.trim();
      if (txHash) {
        window.location.href = `/tx?hash=${txHash}`;
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
          const response = await fetch(`/api/tx?blockNum=${nextBlock}&batchSize=10&fields=hash,from,to,value,gasPrice,gasLimit,nonce,blockNumber`);
          const result = await response.json();
          
          if (result.data && result.data.length > 0) {
            const flattenData = result.data.flat();
            const tbody = document.querySelector('table tbody');
            
            // 添加新行到表格
            flattenData.forEach(tx => {
              const row = document.createElement('tr');
              row.innerHTML = `
                <td><a href="/tx?hash=${tx.hash}" data-link>${shortenAddress(tx.hash)}</a></td>
                <td><a href="/account?address=${tx.from}" data-link>${shortenAddress(tx.from)}</a></td>
                <td>${tx.to ? `<a href="/account?address=${tx.to}" data-link>${shortenAddress(tx.to)}</a>` : '<span class="badge bg-info">合约创建</span>'}</td>
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
  
  // 高亮代码
  document.querySelectorAll('pre code').forEach((block) => {
    if (window.hljs) {
      window.hljs.highlightElement(block);
    }
  });
};

// 导出默认视图函数
export default TransactionView;