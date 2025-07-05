/**
 * 区块列表和详情视图
 */

import { showToast, formatDateTime, shortenAddress } from '../utils.js';
import { fetchBlocks } from '../api.js';
import { getPageSize } from '../settings.js';
/**
 * 渲染区块列表和详情视图
 * @returns {string} HTML内容
 */
const BlockView = async () => {
  const params = new URLSearchParams(window.location.search);
  const blockHash = params.get('hash');
  const page = parseInt(params.get('page') || '1');

  if (blockHash) {
    // 显示区块详情
    return renderBlockDetails(blockHash);
  } else {
    // 显示区块列表
    return renderBlockList(page);
  }
};

/**
 * 渲染区块详情
 * @param {string} blockHash - 区块哈希
 * @returns {string} HTML内容
 */
const renderBlockDetails = async (blockHash) => {
  try {
    const response = await fetch(`/api/block/${blockHash}`);
    const data = await response.json();

    if (!data.block) {
      return `<div class="alert alert-danger m-5">区块 ${blockHash} 未找到</div>`;
    }

    const block = data.block;
    
    return `
      <div class="row mt-4">
        <div class="col-12 mb-4">
          <h2>区块 #${block.number}</h2>
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">区块信息</h5>
              <div class="table-responsive">
                <table class="table">
                  <tbody>
                    <tr>
                      <th scope="row">区块高度</th>
                      <td>${block.number}</td>
                    </tr>
                    <tr>
                      <th scope="row">区块哈希</th>
                      <td><code>${block.hash}</code></td>
                    </tr>
                    <tr>
                      <th scope="row">父区块哈希</th>
                      <td><code>${block.parentHash}</code></td>
                    </tr>
                    <tr>
                      <th scope="row">时间戳</th>
                      <td>${formatDateTime(block.timestamp)}</td>
                    </tr>
                    <tr>
                      <th scope="row">Gas Limit</th>
                      <td>${parseInt(block.gasLimit)}</td>
                    </tr>
                    <tr>
                      <th scope="row">Gas Used</th>
                      <td>${parseInt(block.gasUsed)}</td>
                    </tr>
                    <tr>
                      <th scope="row">交易数</th>
                      <td>${block.transactions.length}</td>
                    </tr>
                    <tr>
                      <th scope="row">矿工</th>
                      <td><a href="/account?address=${block.miner}" data-link>${block.miner}</a></td>
                    </tr>
                    <tr>
                      <th scope="row">难度</th>
                      <td>${parseInt(block.difficulty || 0)}</td>
                    </tr>
                    <tr>
                      <th scope="row">总难度</th>
                      <td>${parseInt(block.totalDifficulty || 0)}</td>
                    </tr>
                    <tr>
                      <th scope="row">大小</th>
                      <td>${parseInt(block.size || 0)} bytes</td>
                    </tr>
                    <tr>
                      <th scope="row">Nonce</th>
                      <td>${block.nonce || '0x0'}</td>
                    </tr>
                    <tr>
                      <th scope="row">Extra Data</th>
                      <td><code>${block.extraData || '0x'}</code></td>
                    </tr>
                    <tr>
                      <th scope="row">Base Fee Per Gas</th>
                      <td>${block.baseFeePerGas ? (parseInt(block.baseFeePerGas) / 1e9).toFixed(2) + ' Gwei' : 'N/A'}</td>
                    </tr>
                    <tr>
                      <th scope="row">Blob Gas Used</th>
                      <td>${block.blobGasUsed || 'N/A'}</td>
                    </tr>
                    <tr>
                      <th scope="row">Excess Blob Gas</th>
                      <td>${block.excessBlobGas || 'N/A'}</td>
                    </tr>
                    <tr>
                      <th scope="row">Prev Randao</th>
                      <td>${block.prevRandao || 'N/A'}</td>
                    </tr>
                    <tr>
                      <th scope="row">难度</th>
                      <td>${parseInt(block.difficulty || 0)}</td>
                    </tr>
                    <tr>
                      <th scope="row">总难度</th>
                      <td>${parseInt(block.totalDifficulty || 0)}</td>
                    </tr>
                    <tr>
                      <th scope="row">大小</th>
                      <td>${parseInt(block.size || 0)} bytes</td>
                    </tr>
                    <tr>
                      <th scope="row">Nonce</th>
                      <td>${block.nonce || '0x0'}</td>
                    </tr>
                    <tr>
                      <th scope="row">Extra Data</th>
                      <td><code>${block.extraData || '0x'}</code></td>
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
              <h5 class="card-title">区块交易 (${block.transactions.length})</h5>
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>交易哈希</th>
                      <th>发送方</th>
                      <th>接收方</th>
                      <th>值</th>
                      <th>Gas Price</th>
                      <th>Gas Limit</th>
                      <th>Nonce</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${block.transactions.length > 0 ? block.transactions.map(tx => `
                      <tr>
                        <td><a href="/tx?hash=${tx.hash}" data-link>${shortenAddress(tx.hash)}</a></td>
                        <td><a href="/account?address=${tx.from}" data-link>${shortenAddress(tx.from)}</a></td>
                        <td>${tx.to ? `<a href="/account?address=${tx.to}" data-link>${shortenAddress(tx.to)}</a>` : 'Contract Creation'}</td>
                        <td>${tx.value ? (parseInt(tx.value) / 1e18).toFixed(6) + ' ETH' : '0 ETH'}</td>
                        <td>${tx.gasPrice ? (parseInt(tx.gasPrice) / 1e9).toFixed(2) + ' Gwei' : 'N/A'}</td>
                        <td>${parseInt(tx.gas || 0)}</td>
                        <td>${tx.nonce || 0}</td>
                      </tr>
                    `).join('') : '<tr><td colspan="7" class="text-center">No transactions</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error rendering block details:', error);
    showToast('Error', 'Failed to load block data');
    return `<div class="alert alert-danger m-5">Failed to load block data: ${error.message}</div>`;
  }
};

/**
 * 渲染区块列表
 * @param {number} page - 页码
 * @returns {string} HTML内容
 */
const renderBlockList = async (page) => {
  try {
    const pageSize = getPageSize(); // 使用全局设置的页面大小
    const { blocks, pagination } = await fetchBlocks(page, pageSize);
    const total = pagination.total;

    const totalPages = Math.ceil(total / pageSize);
    
    return `
      <div class="row mt-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>区块列表</h2>
            <div class="card">
              <div class="card-body p-2">
                <form id="blockSearchForm" class="m-0 d-flex">
                  <input type="text" class="form-control me-2" placeholder="输入区块号" id="blockNumberInput">
                  <button class="btn btn-primary" type="submit">查询</button>
                </form>
              </div>
            </div>
          </div>
          
          <div class="card">
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>区块高度</th>
                      <th>时间戳</th>
                      <th>交易数</th>
                      <th>Gas Used</th>
                      <th>Gas Limit</th>
                      <th>Base Fee</th>
                      <th>区块哈希</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${blocks.map(block => `
                      <tr>
                        <td><a href="/block?hash=${block.hash}" data-link>${block.number}</a></td>
                        <td>${formatDateTime(block.timestamp)}</td>
                        <td>${block.txCount}</td>
                        <td>${parseInt(block.gasUsed)}</td>
                        <td>${parseInt(block.gasLimit)}</td>
                        <td>${block.baseFeePerGas ? (parseInt(block.baseFeePerGas) / 1e9).toFixed(2) + ' Gwei' : 'N/A'}</td>
                        <td><code style="overflow-x: auto; display: inline-block; max-width: 200px;">${block.hash}</code></td>
                        <td><a href="/block?hash=${block.hash}" class="btn btn-sm btn-primary" data-link>详情</a></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              
              <nav aria-label="区块列表分页">
                <ul class="pagination justify-content-center">
                  ${generatePaginationItems(page, totalPages)}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error rendering block list:', error);
    showToast('Error', 'Failed to load blocks');
    return `<div class="alert alert-danger m-5">Failed to load block list: ${error.message}</div>`;
  }

  // 在HTML返回之后添加，让页面渲染完成后执行
  setTimeout(() => {
    // 监听页面大小变更事件
    const pageSizeChangedHandler = () => {
      // 刷新当前页面
      const params = new URLSearchParams(window.location.search);
      const currentPage = parseInt(params.get('page') || '1');
      window.location.href = `/block?page=${currentPage}`;
    };

    // 移除旧的监听器（如果有）
    document.removeEventListener('pageSizeChanged', pageSizeChangedHandler);
    // 添加新的监听器
    document.addEventListener('pageSizeChanged', pageSizeChangedHandler);
  }, 0);
};

/**
 * 生成分页组件
 * @param {number} currentPage - 当前页码
 * @param {number} totalPages - 总页数
 * @returns {string} 分页HTML
 */
const generatePaginationItems = (currentPage, totalPages) => {
  let items = [];
  
  // 添加"上一页"按钮
  items.push(`
    <li class="page-item ${currentPage <= 1 ? 'disabled' : ''}">
      <a class="page-link" href="/block?page=${currentPage - 1}" data-page="${currentPage - 1}" ${currentPage <= 1 ? 'tabindex="-1" aria-disabled="true"' : ''} data-link>上一页</a>
    </li>
  `);
  
  // 计算显示的页码范围
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);
  
  // 确保显示至少5个页码（如果可能）
  if (endPage - startPage < 4 && totalPages > 5) {
    if (startPage === 1) {
      endPage = Math.min(5, totalPages);
    } else if (endPage === totalPages) {
      startPage = Math.max(1, totalPages - 4);
    }
  }
  
  // 添加第一页和省略号（如需要）
  if (startPage > 1) {
    items.push(`
      <li class="page-item">
        <a class="page-link" href="/block?page=1" data-page="1" data-link>1</a>
      </li>
    `);
    if (startPage > 2) {
      items.push('<li class="page-item disabled"><span class="page-link">...</span></li>');
    }
  }
  
  // 添加页码
  for (let i = startPage; i <= endPage; i++) {
    items.push(`
      <li class="page-item ${i === currentPage ? 'active' : ''}">
        <a class="page-link" href="/block?page=${i}" data-page="${i}" data-link>${i}</a>
      </li>
    `);
  }
  
  // 添加最后一页和省略号（如需要）
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      items.push('<li class="page-item disabled"><span class="page-link">...</span></li>');
    }
    items.push(`
      <li class="page-item">
        <a class="page-link" href="/block?page=${totalPages}" data-page="${totalPages}" data-link>${totalPages}</a>
      </li>
    `);
  }
  
  // 添加"下一页"按钮
  items.push(`
    <li class="page-item ${currentPage >= totalPages ? 'disabled' : ''}">
      <a class="page-link" href="/block?page=${currentPage + 1}" data-page="${currentPage + 1}" ${currentPage >= totalPages ? 'tabindex="-1" aria-disabled="true"' : ''} data-link>下一页</a>
    </li>
  `);
  
  return items.join('');
};
/**
 * 区块视图初始化函数
 */
BlockView.init = () => {
  // 区块搜索表单处理
  const blockSearchForm = document.getElementById('blockSearchForm');
  if (blockSearchForm) {
    blockSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const blockNumber = document.getElementById('blockNumberInput').value.trim();
      if (blockNumber) {
        window.location.href = `/block?hash=${blockNumber}`;
      }
    });
  }
  
  // 分页按钮点击处理
  const pagination = document.querySelector('.pagination');
  if (pagination) {
    pagination.addEventListener('click', (e) => {
      const pageLink = e.target.closest('[data-page]');
      if (pageLink && !pageLink.parentElement.classList.contains('disabled') && !pageLink.parentElement.classList.contains('active')) {
        e.preventDefault();
        const page = pageLink.getAttribute('data-page');
        window.location.href = `/block?page=${page}`;
      }
    });
  }
};

// 导出默认视图函数
export default BlockView;