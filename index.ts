import fs from 'fs';
import path from 'path';
import { sed } from 'shelljs';

const workdir = 'workdir';
const fromString = "fromString";
const toString = "@toString";
const withSed = true;

const listFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((dirent: fs.Dirent)=>{
      const filepath = `${dir}/${dirent.name}`;
      if (dirent.isFile()) {
          return [filepath];
      }
      const children = listFiles(filepath);
      if (children.length === 0) {
          return [filepath]
      }
      return children;
  });


const mkdirp = (dirname: string, mode?: fs.Mode) => {
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, {recursive: true, mode});
    }
}

(async function main() {
    if (!fs.existsSync(workdir)) {
        console.log(`ディレクトリが存在しません。[${workdir}]`);
        return;
    }
    const srcFilepaths = listFiles(workdir);
    console.log(srcFilepaths)
    const dstFilepaths = srcFilepaths.map(
        (filepath:string) => filepath.replaceAll(fromString, toString) )
    console.log(dstFilepaths)

    for(let i=0; i<srcFilepaths.length; ++i) {
        const srcFilepath = srcFilepaths[i];
        const dstFilepath = dstFilepaths[i];

        const stats = fs.statSync(srcFilepath);
        if (stats.isDirectory()) {
            // ディレクトリはコピーより作成の方が簡単
            mkdirp(dstFilepath, stats.mode);
        } else {
            const dirname = path.dirname(dstFilepath);
            mkdirp(dirname, stats.mode);
            
            fs.copyFile(srcFilepath, dstFilepath,  (err: NodeJS.ErrnoException | null) => {
                if (err) console.log(err);
                fs.chmodSync(dstFilepath, fs.statSync(srcFilepath).mode);
                if (withSed) {
                    sed('-i', fromString, toString, dstFilepath);
                }
            });
        }
    }
})();