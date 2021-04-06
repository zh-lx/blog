import * as path from 'path';
import * as fs from 'fs';

const getCatalog = (dir) => {
  const children = [];
  const res = fs.readdirSync(dir);
  res.forEach((filename) => {
    const path = `${dir}/${filename}`;
    const stat = fs.statSync(path);
    if (stat && stat.isDirectory()) {
      const obj = {
        text: filename,
        isGroup: true,
        children: getCatalog(path),
      };
      children.unshift(obj);
    } else {
      const completePath = dir.replace(/\\/g, '/');
      const index = completePath.indexOf('/study/');
      children.push(`${completePath.slice(index)}/${filename}`);
    }
  });
  return children;
};

const CatalogPath = path.resolve(__dirname, '../docs/study');

const getPath = (dirName) => path.resolve(CatalogPath, dirName);

module.exports = {
  '/study/docker': getCatalog(getPath('docker')),
};
