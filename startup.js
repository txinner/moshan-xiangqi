function showFailure(error){const el=document.getElementById('boot-status');if(el){el.textContent='页面加载失败：'+(error?.message||'资源暂时不可用')+'。请刷新重试，或在 Edge / Chrome 中打开。';}}
window.addEventListener('error',event=>showFailure(event.error));
window.addEventListener('unhandledrejection',event=>showFailure(event.reason));
import('./main.js').catch(showFailure);
