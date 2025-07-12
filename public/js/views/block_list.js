/**
 * 区块列表视图
 */

import { showToast, formatDateTime, shortenAddress } from '../utils.js';
import { getBatchSize, clearCache } from '../state.js';

// 区块缓存数据
let blockData = [];
let nextBlock = null; // 下一次加载的起始区块：null表示从最新区块开始；-1表示没有更多数据了。

/**
 * 更新区块缓存
 * @param {Object} result - 包含区块数据和下一块信息的对象
 */
// 更新区块缓存
const updateBlockCache = (result) => {
  if (result.data) {
    blockData = [...blockData, ...result.data];
    nextBlock = result.nextBlock;
    console.log('nextBlock:', nextBlock, 'blockData:', blockData.length);
  }
};


/**
 * 渲染单个区块行
 * @param {Object} block - 区块数据
 * @returns {string} 区块行的HTML内容
 */
const renderBlockRow = (block) => {
  return `
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
  `;
};
/**
 * 获取区块列表
 * @param {number} blockNum - 起始区块号
 * @param {number} batchSize - 每批数量
 * @returns {Promise} 包含区块列表的Promise
 */
export async function fetchBlocks(blockNum = null, batchSize = getBatchSize()) {
  try {
    const response = await fetch(`/api/block?blockNum=${blockNum || ''}&batchSize=${batchSize}`);
    if (!response.ok) {
      throw new Error(`Network error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching blocks:', error);
    showToast('Error', 'Failed to fetch blocks');
    throw error;
  }
}

/**
 * 渲染区块列表
 * @returns {string} HTML内容
 */
const renderBlockList = () => {

    return `
      <div class="row mt-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>区块列表</h2>
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
                    ${blockData.map(block => renderBlockRow(block)).join('')}
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
};



const loadMoreItems = async () => {
  try {
    if (nextBlock >= 0) {
      const loadMoreBtn = document.getElementById('loadMoreBtn');
      loadMoreBtn.disabled = true;
      loadMoreBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 加载中...';

      const batchSize = getBatchSize();
      const result = await fetchBlocks(nextBlock, batchSize);

      if (result.data && result.data.length > 0) {
        // 追加新区块到表格
        const blockTableBody = document.getElementById('blockTableBody');
        if (blockTableBody) {
          const newBlocksHtml = result.data.map(block => renderBlockRow(block)).join('');
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
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
      loadMoreBtn.disabled = false;
      loadMoreBtn.innerHTML = '重试加载';
    }
  }
}

const initBlockList = () => {
  // 清空本地区块缓存
  blockData = [];
  nextBlock = null;

  // 加载更多按钮处理
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', async () => loadMoreItems());
  }

  // 加载第一批数据
  loadMoreItems()
};


const BlockListView = async () => {
  return await renderBlockList();
}

BlockListView.init = initBlockList;

export default BlockListView;