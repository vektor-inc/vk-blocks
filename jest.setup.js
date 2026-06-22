global.TextEncoder = require("util").TextEncoder;
// jsdom 環境には MessageChannel が無いが、React 18 の scheduler / react-dom/server が
// 参照するため polyfill する。worker_threads 版は配送が libuv 経由で非同期になり
// テストの setTimeout フラッシュと競合する／open handle が残るため、setTimeout ベースの
// 軽量実装を使う（タイマーフェーズで決定的に配送され、発火後にハンドルが残らない）。
if (typeof global.MessageChannel === "undefined") {
    class PolyfillMessagePort {
        constructor() {
            this.onmessage = null;
            this._listeners = [];
            this._other = null;
        }
        postMessage(data) {
            const target = this._other;
            if (!target) {
                return;
            }
            setTimeout(() => {
                const event = { data };
                if (typeof target.onmessage === "function") {
                    target.onmessage(event);
                }
                target._listeners.forEach((fn) => fn(event));
            }, 0);
        }
        addEventListener(type, fn) {
            // DOM の addEventListener と同様に、同一コールバックの重複登録は無視する。
            if (type === "message" && !this._listeners.includes(fn)) {
                this._listeners.push(fn);
            }
        }
        removeEventListener(type, fn) {
            if (type === "message") {
                this._listeners = this._listeners.filter((l) => l !== fn);
            }
        }
        start() {}
        close() {}
    }
    global.MessageChannel = class MessageChannel {
        constructor() {
            this.port1 = new PolyfillMessagePort();
            this.port2 = new PolyfillMessagePort();
            this.port1._other = this.port2;
            this.port2._other = this.port1;
        }
    };
}
// img_path をモックしてエラーを回避する
global.img_path = {
    full_path: 'path/to/default/image.jpg', // 任意のダミーパスを指定
  };
  