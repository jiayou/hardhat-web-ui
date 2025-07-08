/**
 * 区块列表和详情视图
 */

import { showToast, formatDateTime, shortenAddress } from '../utils.js';
import { fetchBlocks } from '../api.js';
import { getBatchSize, getCachedBlocks, getNextBlock, updateBlockCache, clearCache } from '../state.js';
/**
 * 渲染区块列表和详情视图
 * @returns {string} HTML内容
 */
const BlockView = async () => {
  const params = new URLSearchParams(window.location.search);
  const blockHash = params.get('hash');

  if (blockHash) {
    // 显示区块详情
    return renderBlockDetails(blockHash);
  } else {
    // 显示区块列表
    return renderBlockList();
  }
};

/**
 * 渲染区块详情
 * @param {string} blockHash - 区块哈希
 * @returns {string} HTML内容
 */
const renderBlockDetails = async (blockHash) => {
  try {
    // 获取区块详情
    const response = await fetch(`/api/block/${blockHash}`);
    const data = await response.json();

    if (!data.block) {
      return `<div class="alert alert-danger m-5">区块 ${blockHash} 未找到</div>`;
    }

    // 获取最新区块高度，用于判断"下一个区块"按钮是否可用
    const latestBlockResponse = await fetch(`/api/network/latest-block`);
    const latestBlockData = await latestBlockResponse.json();
    data.latestBlock = latestBlockData.height;

    const block = data.block;
    
    return `
      <div class="row mt-4">
        <div class="col-12 mb-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>区块 #${block.number}</h2>
            <div class="btn-group">
              <a href="/block?hash=${block.parentHash}" class="btn btn-outline-primary" data-link>
                <i class="bi bi-arrow-left"></i> 上一个区块
              </a>
              ${parseInt(block.number) < data.latestBlock ? 
                `<a href="#" class="btn btn-outline-primary next-block-btn" data-number="${parseInt(block.number) + 1}">
                  下一个区块 <i class="bi bi-arrow-right"></i>
                </a>` : 
                `<button class="btn btn-outline-secondary" disabled>
                  下一个区块 <i class="bi bi-arrow-right"></i>
                </button>`
              }
            </div>
          </div>
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
                      <td>${block.txInfo.length}</td>
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
              <h5 class="card-title">区块交易 (${block.txInfo.length})</h5>
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
                    ${block.txInfo.length > 0 ? block.txInfo.map(tx => `
                      <tr>
                        <td><a href="/transaction?hash=${tx.hash}" data-link>${shortenAddress(tx.hash)}</a></td>
                        <td><a href="/account?address=${tx.from}" data-link>${shortenAddress(tx.from)}</a></td>
                        <td>${tx.to ? `<a href="/account?address=${tx.to}" data-link>${shortenAddress(tx.to)}</a>` : 'Contract Creation'}</td>
                        <td>${tx.value ? tx.value + ' ETH' : '0 ETH'}</td>
                        <td>${tx.gasPrice ? tx.gasPrice + ' Gwei' : 'N/A'}</td>
                        <td>${tx.gasLimit}</td>
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
 * @returns {string} HTML内容
 */
const renderBlockList = async () => {
  try {
    const batchSize = getBatchSize(); // 使用全局设置的批量大小
    let blocks = getCachedBlocks(); // 从状态获取已缓存的区块列表
    let nextBlock = getNextBlock(); // 获取下一批区块的起始区块号

    // 如果没有缓存的区块数据，需要初始化加载
    if (blocks.length === 0) {
      const result = await fetchBlocks(null, batchSize); // 获取最新的一批区块
      // 更新缓存
      updateBlockCache(result);
      // 重新获取更新后的缓存数据
      blocks = getCachedBlocks();
      nextBlock = getNextBlock();
    }

    return `
      <div class="row mt-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>区块列表</h2>
            <button id="refreshBlocksBtn" class="btn btn-primary">
              <i class="bi bi-arrow-clockwise"></i> 刷新
            </button>
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
                  <tbody id="blockTableBody">
                    ${blocks.map(block => `
                      <tr>
                        <td><a href="/block?hash=${block.hash}" data-link>${block.number}</a></td>
                        <td>${formatDateTime(block.timestamp)}</td>
                        <td>${block.transactions ? block.transactions.length : 0}</td>
                        <td>${parseInt(block.gasUsed)}</td>
                        <td>${parseInt(block.gasLimit)}</td>
                        <td>${block.baseFeePerGas ? (parseInt(block.baseFeePerGas) / 1e9).toFixed(2) + ' Gwei' : 'N/A'}</td>
                        <td><code style="overflow-x: auto; display: inline-block; max-width: 200px;">${shortenAddress(block.hash)}</code></td>
                        <td><a href="/block?hash=${block.hash}" class="btn btn-sm btn-primary" data-link>详情</a></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              
              <div class="text-center mt-4">
                <button id="loadMoreBtn" class="btn btn-primary" ${nextBlock < 0 ? 'disabled' : ''}>
                  加载更多
                </button>
              </div>
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

  // 刷新按钮处理
  const refreshBlocksBtn = document.getElementById('refreshBlocksBtn');
  if (refreshBlocksBtn) {
    refreshBlocksBtn.addEventListener('click', () => {
      clearCache('blocks');
      window.location.href = '/block'; // 重定向到区块列表页面，触发重新渲染
    });
  }

  // 加载更多按钮处理
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', async () => {
      try {
        const nextBlock = getNextBlock();
        if (nextBlock >= 0) {
          loadMoreBtn.disabled = true;
          loadMoreBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 加载中...';

          const batchSize = getBatchSize();
          const result = await fetchBlocks(nextBlock, batchSize);

          if (result.data && result.data.length > 0) {
            // 追加新区块到表格
            const blockTableBody = document.getElementById('blockTableBody');
            if (blockTableBody) {
              const newBlocksHtml = result.data.map(block => `
                <tr>
                  <td><a href="/block?hash=${block.hash}" data-link>${block.number}</a></td>
                  <td>${formatDateTime(block.timestamp)}</td>
                  <td>${block.transactions ? block.transactions.length : 0}</td>
                  <td>${parseInt(block.gasUsed)}</td>
                  <td>${parseInt(block.gasLimit)}</td>
                  <td>${block.baseFeePerGas ? (parseInt(block.baseFeePerGas) / 1e9).toFixed(2) + ' Gwei' : 'N/A'}</td>
                  <td><code style="overflow-x: auto; display: inline-block; max-width: 200px;">${block.hash}</code></td>
                  <td><a href="/block?hash=${block.hash}" class="btn btn-sm btn-primary" data-link>详情</a></td>
                </tr>
              `).join('');

              blockTableBody.insertAdjacentHTML('beforeend', newBlocksHtml);
            }

            // 更新缓存
            updateBlockCache(result)

            // 更新按钮状态
            loadMoreBtn.disabled = result.nextBlock < 0;
            loadMoreBtn.innerHTML = '加载更多';

            // 如果没有更多区块可加载，禁用按钮
            if (result.nextBlock < 0) {
              loadMoreBtn.disabled = true;
              loadMoreBtn.innerHTML = '没有更多区块';
            }
          } else {
            loadMoreBtn.disabled = true;
            loadMoreBtn.innerHTML = '没有更多区块';
          }
        }
      } catch (error) {
        console.error('加载更多区块失败:', error);
        showToast('Error', '加载更多区块失败');
        loadMoreBtn.disabled = false;
        loadMoreBtn.innerHTML = '重试加载';
      }
    });
  }

  const nextBlockBtn = document.querySelector('.next-block-btn');
  if (nextBlockBtn) {
    nextBlockBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const nextBlockNum = nextBlockBtn.getAttribute('data-number');
      if (nextBlockNum) {
        try {
          // 查询区块号对应的区块哈希
          const response = await fetch(`/api/block/${nextBlockNum}`);
          const data = await response.json();
          if (data.block && data.block.hash) {
            // 导航到下一个区块的详情页
            window.location.href = `/block?hash=${data.block.hash}`;
          } else {
            showToast('错误', `无法获取区块 #${nextBlockNum}`);
          }
        } catch (error) {
          console.error('获取下一个区块时出错:', error);
          showToast('错误', '无法获取下一个区块');
        }
      }
    });
  }


  // 监听批量大小变更事件
  const batchSizeChangedHandler = () => {
    // do nothing
  };

  // 移除旧的监听器（如果有）
  document.removeEventListener('batchSize-changed', batchSizeChangedHandler);
  // 添加新的监听器
  document.addEventListener('batchSize-changed', batchSizeChangedHandler);
};

// 导出默认视图函数
export default BlockView;