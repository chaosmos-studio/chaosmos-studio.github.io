// Stream the engine and game pack from static-host-friendly chunks.
(() => {
  const nativeFetch = window.fetch.bind(window);
  const assets = {"index.wasm": {"parts": ["index.wasm.part0", "index.wasm.part1", "index.wasm.part2", "index.wasm.part3", "index.wasm.part4", "index.wasm.part5", "index.wasm.part6", "index.wasm.part7", "index.wasm.part8", "index.wasm.part9"], "size": 39509339, "sha256": "7eda98958eb09135a1acb54a4323a00b1a55af1997f15fa1cdc2b93e3df46656", "content_type": "application/wasm"}, "index.pck": {"parts": ["index.pck.part0"], "size": 1474308, "sha256": "7dd6b68b3b08a25c0e5b0ff49dd5625931c3f154f0336027c4a969ab452afab4", "content_type": "application/octet-stream"}};
  const base = new URL('.', document.currentScript.src);
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
          while (true) {const {done, value} = await reader.read(); if (done) break; controller.enqueue(value);}
        }
        controller.close();
      } catch (error) {controller.error(error);}
    }});
    return new Response(stream, {headers: {'Content-Type': asset.content_type, 'Content-Length': String(asset.size)}});
  };
})();
