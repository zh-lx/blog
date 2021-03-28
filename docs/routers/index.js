const path = require('path');
const fs = require('fs');

const getCatalog = (dir) => {
  const children = [];
  const res = fs.readdirSync(dir);
  res.forEach((filename) => {
    const path = `${dir}/${filename}`;
    const stat = fs.statSync(path);
    if (stat && stat.isDirectory()) {
      const obj = {
        title: filename,
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

const getPath = (dirName) => path.resolve(__dirname, '../study', dirName);

module.exports = {
  '/study/docker': getCatalog(getPath('docker')),
};
