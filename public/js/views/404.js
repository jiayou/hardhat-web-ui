/**
 * 404页面视图
 */

import { t } from '../i18n.js';

export default async function() {
  return `
    <div class="container mt-5">
      <div class="row">
        <div class="col-md-8 mx-auto text-center">
          <h1 class="display-1">404</h1>
          <h2 class="mb-4" data-i18n="error.notFound">页面未找到</h2>
          <p class="lead mb-5" data-i18n="error.pageNotExist">您请求的页面不存在或已被移除。</p>
          <a href="/" class="btn btn-primary" data-link data-i18n="error.backHome">返回首页</a>
        </div>
      </div>
    </div>
  `;
}
