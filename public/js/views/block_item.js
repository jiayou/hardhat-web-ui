/**
 * 区块详情视图
 */

import { showToast, formatDateTime, shortenAddress } from '../utils.js';

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
 * 区块详情视图初始化函数
 */
const initBlockDetails = () => {
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
};

// 默认导出视图函数，附加init方法以符合路由器要求
const blockItemView = (blockId) => renderBlockDetails(blockId);
blockItemView.init = initBlockDetails;

export default blockItemView;
