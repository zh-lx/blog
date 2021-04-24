import * as path from 'path';
import * as fs from 'fs';
const absolutePath = path.resolve(__dirname, '../docs');

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
      const completePath = dir;
      children.push(
        `${completePath.slice(absolutePath.length)}/${filename}`.replace(
          '\\',
          '/'
        )
      );
    }
  });
  return children;
};

const CatalogPath = path.resolve(__dirname, '../docs');

const getPath = (dirName) => path.resolve(CatalogPath, dirName);
const CI_CD = getCatalog(getPath('CI.CD'));
const 工程化 = getCatalog(getPath('工程化'));
const react = getCatalog(getPath('react'));
const team = getCatalog(getPath('team'));
const vue2 = getCatalog(getPath('vue2'));

module.exports = {
  '/CI.CD': CI_CD,
  '/工程化': 工程化,
  '/react': react,
  '/team': team,
  '/vue2': vue2,
};
