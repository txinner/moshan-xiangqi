from pathlib import Path
import zipfile
root=Path(__file__).parent
with zipfile.ZipFile(root/'public/source.zip','w',zipfile.ZIP_DEFLATED) as z:
    for name in ['difficulty.js','easy-ai.js','room-client.js','effects.js','storage.js','startup.js','main.js','style.css','index.html','rules.js','sound.js','engine.js','local-server.mjs','启动游戏.cmd','drizzle.config.js','package.json','pnpm-lock.yaml','vite.config.js','README.md','LICENSE','package-source.py','.openai/hosting.json']:
        z.write(root/name,name)
    for folder in ['worker','server','db','drizzle','scripts','tests']:
        for file in (root/folder).rglob('*'):
            if file.is_file() and file.suffix in ['.js','.mjs','.json','.sql']:
                z.write(file,file.relative_to(root))
    for file in (root/'public').rglob('*'):
        if file.is_file() and file.name!='source.zip' and not file.name.startswith('pikafish.'):
            z.write(file,file.relative_to(root))
