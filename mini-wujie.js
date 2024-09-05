// 创建wujie
function defineWujieWebComponent() {
    /**
     * @description 创建iframe
     * @returns iframe
     */
    function iframeGenerator() {
      const iframe = document.createElement("iframe");
      iframe.setAttribute("style", "display: none");
      iframe.src = "about:blank";
      document.body.appendChild(iframe);
  
      // 处理 副作用
      return iframe;
    }
  
    /**
     * 创建沙箱
     */
    function createWujieSandbox() {
      const sandbox = {
        /** js沙箱 */
        iframe: iframeGenerator(),
        /** css沙箱 */
        shadowRoot: null,
      };
  
      return sandbox;
    }
  
    /**
     * mock 解析html、js
     */
    function importHTML() {
      const template = `
              <!DOCTYPE html>
              <html lang="en">
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Document</title>
                  <style>
                      .text {
                          font-size: 20px;
                          color: rebeccapurple;
                      }
                  </style>
              </head>
              <body>
                  <div class="text" id="echo">wujie 子应用</div>
              </body>
              </html>
          `;
  
      const code = `
              // code 用于验证 window
              window.name = 'echo';
              console.log(window.name, '输出name');
              // code 用于验证 document porxy
              const el = document.querySelector('#echo');
              console.log(el, '输出el');
          `;
  
      return {
        template,
        code,
      };
    }
  
    /**
     * 将template渲染到shadowRoot
     */
    function renderTemplateToShadowRoot(sandbox, template) {
      const shade = document.createElement("div");
      shade.innerHTML = template;
      sandbox.shadowRoot.appendChild(shade);
    }
  
    // 执行js
    function insertScriptToIframe(sandbox, script) {
      const iframeWindow = sandbox.iframe.contentWindow;
      const scriptElement = iframeWindow.document.createElement("script");
  
      // const container = rawDocumentQuerySelector.call(iframeWindow.document, "head");
      // const execNextScript = () => !async && container.appendChild(nextScriptElement);
      const container = iframeWindow.document.querySelector('head');
      scriptElement.textContent = script;
  
      // todo 处理 非降级情况下window、document、location代理 proxyGenerator
      // patchDocumentEffect  patch document effect
      const proxyDocument = new Proxy(
          {},
          {
              get: function (_fakeDocument, propKey) {
                  console.log('111')
                  if(propKey === 'querySelector') {
                      return new Proxy(sandbox.shadowRoot[propKey], {
                          apply(target, ctx, args){
                              console.log(target, ctx, args, 'target, ctx, args')
                              if (ctx !== sandbox.iframe.contentDocument) {
                                  return ctx[propKey]?.apply(ctx, args);
                              }
                              return target.apply(sandbox.shadowRoot, args);
                          }
                      })
                  }
              }
          }
      )
  
      try {
          Object.defineProperty(iframeWindow.Document.prototype, 'querySelector', {
            configurable: true,
            get: () => proxyDocument['querySelector'],
            set: undefined,
          });
      } catch (e) {
      throw(e)
      }
  
      container.appendChild(scriptElement);
    }
  
    // 创建wujie
    class WujieApp extends HTMLElement {
      connectedCallback() {
        // 当自定义元素第一次被连接到文档 DOM 时被调用。
        console.log("weijie容器加载成功");
        // todo： 创建沙箱、创建shadowDOM、将html、css放入shadowDOM、沙箱执行js
        // 1. 创建沙箱
        const sandbox = createWujieSandbox();
        // 2. 创建shadowDOM
        sandbox.shadowRoot = this.attachShadow({ mode: "open" });
        // 3. 获取html、css、js => importHTML
        // mock
        const { template, code } = importHTML();
        // 4. 将html、css放入shadowDOM中
        renderTemplateToShadowRoot(sandbox, template);
        // 5. 执行js
        insertScriptToIframe(sandbox, code);
      }
  
      disconnectedCallback() {
        // 当自定义元素与文档 DOM 断开连接时被调用。
        // todo
      }
    }
  
    customElements?.define("wujie-app", WujieApp);
    const container = document.querySelector("#container");
    container.appendChild(document.createElement("wujie-app"));
  }
  
  window.defineWujieWebComponent = defineWujieWebComponent;
  