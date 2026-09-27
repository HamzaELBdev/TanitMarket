const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { spawn } = require('child_process');
const FF='/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2';
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1920,height:1080}});
  await p.goto('file://'+__dirname+'/index.html?render'); await p.evaluate(()=>document.fonts.ready);
  const D=await p.evaluate(()=>window.DURATION), FPS=30, N=Math.round(D*FPS);
  const ff=spawn(FF,['-y','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-',
    '-c:v','libx264','-pix_fmt','yuv420p','-crf','18','-preset','medium','-movflags','+faststart',__dirname+'/TanitMarket-presentation.mp4'],{stdio:['pipe','inherit','inherit']});
  for(let i=0;i<N;i++){
    await p.evaluate(t=>window.render(t),i/FPS);
    const buf=await p.screenshot({type:'jpeg',quality:95});
    if(!ff.stdin.write(buf)) await new Promise(r=>ff.stdin.once('drain',r));
    if(i%150===0) console.log('frame',i,'/',N);
  }
  ff.stdin.end(); await new Promise(r=>ff.on('close',r)); await b.close();
})();
