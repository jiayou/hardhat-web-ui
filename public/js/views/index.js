/**
 * 首页视图
 */

import { showToast } from '../utils.js';
import { t } from '../i18n.js';

/**
 * 渲染首页视图
 * @returns {string} HTML内容
 */
const IndexView = async () => {
  try {
    const response = await fetch('/api/network/info');
    const networkData = await response.json();

    // 更新网络信息显示
    if (networkData.network) {
      document.getElementById('networkName').textContent = networkData.network.name || t('common.unknown');
      document.getElementById('chainId').textContent = networkData.network.chainId || '-';
    }

    return `
      <div class="row mt-4">
        <div class="col-md-12 mb-4">
          <h2>${t('dashboard.title')}</h2>
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">${t('dashboard.networkInfo')}</h5>
              <div class="table-responsive">
                <table class="table">
                  <tbody>
                    <tr>
                      <th scope="row">${t('dashboard.networkName')}</th>
                      <td>${networkData.network?.name || t('common.unknown')}</td>
                    </tr>
                    <tr>
                      <th scope="row">${t('nav.chainId')}</th>
                      <td>${networkData.network?.chainId || '-'}</td>
                    </tr>
                    <tr>
                      <th scope="row">${t('dashboard.latestBlock')}</th>
                      <td>${networkData.latestBlock?.number || t('common.unknown')}</td>
                    </tr>
                    <tr>
                      <th scope="row">${t('dashboard.gasPrice')}</th>
                      <td>${networkData.gasPrice ? (parseInt(networkData.gasPrice) / 1e9) + ' Gwei' : t('common.unknown')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error rendering index view:', error);
    showToast(t('common.error'), t('dashboard.failedToLoad'));
    return `<div class="alert alert-danger m-5">${t('dashboard.failedToLoad')}: ${error.message}</div>`;
  }
};


// 导出默认视图函数
export default IndexView;