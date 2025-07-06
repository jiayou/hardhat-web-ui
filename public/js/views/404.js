/**
 * 404页面视图
 */

export default async function() {
  return `
    <div class="container mt-5">
      <div class="row">
        <div class="col-md-8 mx-auto text-center">
          <h1 class="display-1">404</h1>
          <h2 class="mb-4">页面未找到</h2>
          <p class="lead mb-5">您请求的页面不存在或已被移除。</p>
          <a href="/" class="btn btn-primary" data-link>返回首页</a>
        </div>
      </div>
    </div>
  `;
}
