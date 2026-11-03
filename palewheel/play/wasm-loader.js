// Stream the engine and game pack from static-host-friendly chunks.
(() => {
  const nativeFetch = window.fetch.bind(window);
  const assets = {"index.wasm": {"parts": ["index.wasm.part0", "index.wasm.part1", "index.wasm.part2", "index.wasm.part3", "index.wasm.part4", "index.wasm.part5", "index.wasm.part6", "index.wasm.part7", "index.wasm.part8", "index.wasm.part9"], "size": 39509339, "sha256": "7eda98958eb09135a1acb54a4323a00b1a55af1997f15fa1cdc2b93e3df46656", "content_type": "application/wasm"}, "index.pck": {"parts": ["index.pck.part0", "index.pck.part1", "index.pck.part2", "index.pck.part3", "index.pck.part4", "index.pck.part5", "index.pck.part6"], "size": 27409580, "sha256": "574ffeffa9a0f71039d290aaa698a7de05747e33de1a52c3153a36b6620c4eaa", "content_type": "application/octet-stream"}};
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
        for (const part of asset.parts) {
          const partUrl = new URL(part, base);
          partUrl.searchParams.set('v', asset.sha256.slice(0, 12));
          const response = await nativeFetch(partUrl, options);
          if (!response.ok) throw new Error('Game download failed: ' + response.status);
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
