// Stream the engine and game pack from static-host-friendly chunks.
(() => {
  const nativeFetch = window.fetch.bind(window);
  const assets = {"index.wasm": {"parts": ["index.wasm.part0", "index.wasm.part1", "index.wasm.part2", "index.wasm.part3", "index.wasm.part4", "index.wasm.part5", "index.wasm.part6", "index.wasm.part7", "index.wasm.part8", "index.wasm.part9"], "size": 39509339, "sha256": "7eda98958eb09135a1acb54a4323a00b1a55af1997f15fa1cdc2b93e3df46656", "content_type": "application/wasm"}, "index.pck": {"parts": ["index.pck.part0", "index.pck.part1", "index.pck.part2", "index.pck.part3", "index.pck.part4", "index.pck.part5", "index.pck.part6", "index.pck.part7", "index.pck.part8"], "size": 35761640, "sha256": "7e66f580fed103e45d6c180cf8b2969d8182515977223e853d20a2ee5f471ef5", "content_type": "application/octet-stream"}};
  const base = new URL('.', document.currentScript.src);
  const received = Object.fromEntries(Object.keys(assets).map(name => [name, 0]));
  const total = Object.values(assets).reduce((sum, asset) => sum + asset.size, 0);
  const report = () => window.palewheelDownload?.(Object.values(received).reduce((sum, size) => sum + size, 0), total);
  report();
  window.fetch = async function(resource, options) {
    const url = new URL(typeof resource === 'string' ? resource : resource.url || String(resource), location.href);
    const name = Object.keys(assets).find(candidate => url.href === new URL(candidate, base).href);
    if (!name) return nativeFetch(resource, options);
    const asset = assets[name];
    const stream = new ReadableStream({async start(controller) {
      try {
        const prefetchWindow = 2;
        const pending = new Map();
        const requestPart = index => {
          const partUrl = new URL(asset.parts[index], base);
          partUrl.searchParams.set('v', asset.sha256.slice(0, 12));
          return nativeFetch(partUrl, options).then(response => ({response}), error => ({error}));
        };
        for (let index = 0; index < Math.min(prefetchWindow, asset.parts.length); index++) {
          pending.set(index, requestPart(index));
        }
        for (let index = 0; index < asset.parts.length; index++) {
          const result = await pending.get(index);
          pending.delete(index);
          if (result.error) throw result.error;
          const response = result.response;
          if (!response.ok) throw new Error('Game download failed: ' + response.status);
          const next = index + prefetchWindow;
          if (next < asset.parts.length) pending.set(next, requestPart(next));
          const reader = response.body.getReader();
          while (true) {
            const {done, value} = await reader.read();
            if (done) break;
            received[name] += value.byteLength;
            report();
            controller.enqueue(value);
          }
        }
        controller.close();
      } catch (error) {controller.error(error);}
    }});
    return new Response(stream, {headers: {'Content-Type': asset.content_type, 'Content-Length': String(asset.size)}});
  };
})();
