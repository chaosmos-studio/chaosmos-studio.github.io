// Reassemble the engine from static-host-friendly chunks.
(() => {
  const nativeFetch = window.fetch.bind(window);
  const parts = ["index.wasm.part0", "index.wasm.part1", "index.wasm.part2", "index.wasm.part3", "index.wasm.part4", "index.wasm.part5", "index.wasm.part6", "index.wasm.part7", "index.wasm.part8", "index.wasm.part9"];
  const base = new URL('.', document.currentScript.src);
  window.fetch = async function(resource, options) {
    const url = new URL(typeof resource === 'string' ? resource : resource.url || String(resource), location.href);
    if (url.href !== new URL('index.wasm', base).href) return nativeFetch(resource, options);
    const responses = await Promise.all(parts.map(name => nativeFetch(new URL(name, base), options)));
    for (const response of responses) if (!response.ok) throw new Error('Engine download failed: ' + response.status);
    const stream = new ReadableStream({async start(controller) {
      try {
        for (const response of responses) {
          const reader = response.body.getReader();
          while (true) {const {done,value}=await reader.read();if(done)break;controller.enqueue(value);}
        }
        controller.close();
      } catch (error) {controller.error(error);}
    }});
    return new Response(stream,{headers:{'Content-Type':'application/wasm','Content-Length':'38047590'}});
  };
})();
