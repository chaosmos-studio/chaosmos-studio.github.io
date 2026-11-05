// Stream the engine and game pack from static-host-friendly chunks.
(() => {
  const nativeFetch = window.fetch.bind(window);
  const assets = {"index.wasm": {"parts": ["index.wasm.part0", "index.wasm.part1", "index.wasm.part2", "index.wasm.part3", "index.wasm.part4", "index.wasm.part5", "index.wasm.part6", "index.wasm.part7", "index.wasm.part8", "index.wasm.part9"], "size": 39509339, "sha256": "7eda98958eb09135a1acb54a4323a00b1a55af1997f15fa1cdc2b93e3df46656", "content_type": "application/wasm", "gzip_parts": ["index.wasm.gz.part0", "index.wasm.gz.part1", "index.wasm.gz.part2"], "gzip_size": 10052173}, "index.pck": {"parts": ["index.pck.part0", "index.pck.part1", "index.pck.part2", "index.pck.part3", "index.pck.part4", "index.pck.part5", "index.pck.part6", "index.pck.part7", "index.pck.part8", "index.pck.part9"], "size": 38457580, "sha256": "6fe70d453ad8bae46eb4e25fe32df00acd0cfaefbf96379d812413fc9e63aeea", "content_type": "application/octet-stream"}};
  const base = new URL('.', document.currentScript.src);
  // itch's HTML host expands gzip chunks while extracting the uploaded ZIP.
  const useGzip = typeof DecompressionStream === 'function' && !location.hostname.endsWith('.itch.zone');
  const selected = Object.fromEntries(Object.entries(assets).map(([name, asset]) => [name,
    useGzip && asset.gzip_parts
      ? {parts: asset.gzip_parts, size: asset.gzip_size, gzip: true}
      : {parts: asset.parts, size: asset.size, gzip: false}
  ]));
  const received = Object.fromEntries(Object.keys(assets).map(name => [name, 0]));
  const total = Object.values(selected).reduce((sum, asset) => sum + asset.size, 0);
  const report = () => window.palewheelDownload?.(Object.values(received).reduce((sum, size) => sum + size, 0), total);
  report();
  window.fetch = async function(resource, options) {
    const url = new URL(typeof resource === 'string' ? resource : resource.url || String(resource), location.href);
    const name = Object.keys(assets).find(candidate => url.href === new URL(candidate, base).href);
    if (!name) return nativeFetch(resource, options);
    const asset = assets[name];
    const download = selected[name];
    const stream = new ReadableStream({async start(controller) {
      try {
        const prefetchWindow = 2;
        const pending = new Map();
        const requestPart = index => {
          const partUrl = new URL(download.parts[index], base);
          partUrl.searchParams.set('v', asset.sha256.slice(0, 12));
          return nativeFetch(partUrl, options).then(response => ({response}), error => ({error}));
        };
        for (let index = 0; index < Math.min(prefetchWindow, download.parts.length); index++) {
          pending.set(index, requestPart(index));
        }
        for (let index = 0; index < download.parts.length; index++) {
          const result = await pending.get(index);
          pending.delete(index);
          if (result.error) throw result.error;
          const response = result.response;
          if (!response.ok) throw new Error('Game download failed: ' + response.status);
          const next = index + prefetchWindow;
          if (next < download.parts.length) pending.set(next, requestPart(next));
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
    const decoded = download.gzip ? stream.pipeThrough(new DecompressionStream('gzip')) : stream;
    return new Response(decoded, {headers: {'Content-Type': asset.content_type, 'Content-Length': String(asset.size)}});
  };
})();
