/**
 * 交易详情视图
 */

import { showToast, formatDateTime, shortenAddress } from '../utils.js';
import { t } from '../i18n.js';

/**
 * 渲染交易详情视图
 * @param {string} txHash - 交易哈希
 * @returns {string} HTML内容
 */
const TransactionItemView = async (txHash) => {
  try {
    const response = await fetch(`/api/transaction/${txHash}`);
    const data = await response.json();

    if (!data.transaction) {
      return `<div class="alert alert-danger m-5">${t("error.notFound")}: ${txHash}</div>`;
    }

    const tx = data.transaction;
    const receipt = data.receipt;
    
    // 获取所有可用字段，过滤掉已经在表格中明确展示的字段
    const explicitFields = ['hash', 'from', 'to', 'value', 'gasPrice', 'gasLimit', 'maxPriorityFeePerGas', 'maxFeePerGas', 'type', 'data'];
    const additionalTxFields = Object.keys(tx).filter(key => !explicitFields.includes(key));
    const additionalReceiptFields = receipt ? Object.keys(receipt).filter(key => key !== 'logs') : [];

    return `
      <div class="row mt-4">
        <div class="col-12 mb-4">
          <h2 data-i18n="transaction.details">交易详情</h2>
          <div class="card">
            <div class="card-body">
              <h5 class="card-title" data-i18n="transaction.details">交易信息</h5>
              <div class="table-responsive">
                <table class="table">
                  <tbody>
                    <tr>
                      <th scope="row" data-i18n="transaction.hash">交易哈希</th>
                      <td><code>${tx.hash}</code></td>
                    </tr>
                    <tr>
                      <th scope="row" data-i18n="transaction.blockNumber">区块号</th>
                      <td>
                        ${receipt?.blockNumber ?
                          `<a href="/block?number=${receipt.blockNumber}" data-link>${receipt.blockNumber}</a>` :
                          `<span data-i18n="transaction.pending">待处理</span>`}
                      </td>
                    </tr>
                    <tr>
                      <th scope="row" data-i18n="transaction.from">发送方</th>
                      <td>
                        <a href="/account?address=${tx.from}" data-link>${tx.from}</a>
                      </td>
                    </tr>
                    <tr>
                      <th scope="row" data-i18n="transaction.to">接收方</th>
                      <td>
                        ${tx.to ?
                          `<a href="/account?address=${tx.to}" data-link>${tx.to}</a>` :
                          '<span class="badge bg-info" data-i18n="transaction.contractCreation">合约创建</span>'}
                      </td>
                    </tr>
                    <tr>
                      <th scope="row" data-i18n="transaction.value">值</th>
                      <td>${tx.value ? (parseInt(tx.value) / 1e18).toFixed(6) + ' ETH' : '0 ETH'}</td>
                    </tr>
                    <tr>
                      <th scope="row" data-i18n="transaction.gasPrice">Gas价格</th>
                      <td>${tx.gasPrice ? (parseInt(tx.gasPrice) / 1e9) + ' Gwei' : 'N/A'}</td>
                    </tr>
                    ${tx.type >= 2 ? `
                    <tr>
                      <th scope="row" data-i18n="transaction.maxPriorityFee">最高优先费</th>
                      <td>${tx.maxPriorityFeePerGas ? (parseInt(tx.maxPriorityFeePerGas) / 1e9) + ' Gwei' : 'N/A'}</td>
                    </tr>
                    <tr>
                      <th scope="row" data-i18n="transaction.maxFeePerGas">最高Gas费</th>
                      <td>${tx.maxFeePerGas ? (parseInt(tx.maxFeePerGas) / 1e9) + ' Gwei' : 'N/A'}</td>
                    </tr>
                    ` : ''}
                    <tr>
                      <th scope="row" data-i18n="transaction.gasLimit">Gas上限</th>
                      <td>${parseInt(tx.gasLimit)}</td>
                    </tr>
                    <tr>
                      <th scope="row" data-i18n="transaction.type">交易类型</th>
                      <td>${tx.type !== undefined ? `Type-${tx.type}` : 'Legacy'}</td>
                    </tr>
                    <tr>
                      <th scope="row" data-i18n="transaction.status">状态</th>
                      <td>
                        ${receipt ?
                          (receipt.status ?
                            `<span class="badge bg-success">${t('transaction.success')}</span>` :
                            `<span class="badge bg-danger">${t('transaction.failed')}</span>`) :
                          `<span class="badge bg-warning">${t('transaction.pending')}</span>`}
                      </td>
                    </tr>
                    ${additionalTxFields.map(field => `
                    <tr>
                      <th scope="row">${field}</th>
                      <td>${typeof tx[field] === 'object' ? 
                          '<pre class="mb-0"><code>' + JSON.stringify(tx[field], null, 2) + '</code></pre>' : 
                          tx[field]}</td>
                    </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        ${receipt ? `
        <div class="col-12 mb-4">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title" data-i18n="transaction.receipt">交易回执详情</h5>
              <div class="table-responsive">
                <table class="table">
                  <tbody>
                    <tr>
                      <th scope="row" data-i18n="transaction.status">交易状态</th>
                      <td>
                        ${receipt.status ? 
                          '<span class="badge bg-success">成功</span>' :
                          '<span class="badge bg-danger">失败</span>'}
                      </td>
                    </tr>
                    <tr>
                      <th scope="row" data-i18n="transaction.blockNumber">区块号</th>
                      <td><a href="/block?number=${receipt.blockNumber}" data-link>${receipt.blockNumber}</a></td>
                    </tr>
                    <tr>
                      <th scope="row" data-i18n="transaction.gasUsed">Gas使用量</th>
                      <td>${parseInt(receipt.gasUsed)}</td>
                    </tr>
                    <tr>
                      <th scope="row" data-i18n="transaction.cumulativeGasUsed">累计Gas使用量</th>
                      <td>${parseInt(receipt.cumulativeGasUsed)}</td>
                    </tr>
                    ${receipt.effectiveGasPrice ? `
                    <tr>
                      <th scope="row" data-i18n="transaction.effectiveGasPrice">实际Gas价格</th>
                      <td>${(parseInt(receipt.effectiveGasPrice) / 1e9).toFixed(2) + ' Gwei'}</td>
                    </tr>
                    ` : ''}
                    ${additionalReceiptFields
                      .filter(field => field !== 'status' && field !== 'blockNumber' && field !== 'gasUsed' && field !== 'cumulativeGasUsed' && field !== 'effectiveGasPrice')
                      .map(field => `
                    <tr>
                      <th scope="row">${field}</th>
                      <td>${typeof receipt[field] === 'object' ? 
                          '<pre class="mb-0"><code>' + JSON.stringify(receipt[field], null, 2) + '</code></pre>' : 
                          receipt[field]}</td>
                    </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        ` : ''}

        ${receipt?.logs && receipt.logs.length > 0 ? `
        <div class="col-12 mb-4">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title" data-i18n="transaction.eventLogs">事件日志</h5>
              <div class="accordion" id="eventLogsAccordion">
                ${receipt.logs.map((log, index) => `
                  <div class="accordion-item">
                    <h2 class="accordion-header" id="heading${index}">
                      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${index}">
                        <span data-i18n="transaction.log">日志</span> #${index} - <span data-i18n="account.address">地址</span>: ${shortenAddress(log.address)}
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
              <h5 class="card-title" data-i18n="transaction.data">输入数据</h5>
              <pre class="mt-3"><code>${tx.data === '0x' ? `(${t("common.unknown")})` : tx.data}</code></pre>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error rendering transaction item view:', error);
    showToast(t('common.error'), t('error.loadingError'));
    return `<div class="alert alert-danger m-5">${t('error.loadingError')}: ${error.message}</div>`;
  }
};

/**
 * 交易详情视图初始化函数
 */
TransactionItemView.init = () => {
  // 高亮代码
  document.querySelectorAll('pre code').forEach((block) => {
    if (window.hljs) {
      window.hljs.highlightElement(block);
    }
  });
};

// 导出默认视图函数
export default TransactionItemView;