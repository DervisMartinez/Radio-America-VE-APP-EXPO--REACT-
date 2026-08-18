const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const files = walkSync('src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace hardcoded #131314 with surface
  content = content.replace(/bg-\[#131314\]/g, 'bg-surface');
  content = content.replace(/bg-\[#131314\]\/(\d+)/g, 'bg-surface/$1');
  
  // Transform backgrounds
  // If it has bg-surface but not dark:bg-surface
  content = content.replace(/\bbg-surface\b/g, 'bg-white dark:bg-surface');
  content = content.replace(/\bbg-surface\/(10|20|30|40|50|60|70|80|90|95)\b/g, 'bg-white/$1 dark:bg-surface/$1');
  
  content = content.replace(/\bbg-surface-container\b/g, 'bg-gray-100 dark:bg-surface-container');
  content = content.replace(/\bbg-surface-container\/(10|20|30|40|50|60|70|80|90|95)\b/g, 'bg-gray-100/$1 dark:bg-surface-container/$1');
  
  content = content.replace(/\bbg-surface-container-low\b/g, 'bg-gray-50 dark:bg-surface-container-low');
  content = content.replace(/\bbg-surface-container-high\b/g, 'bg-gray-200 dark:bg-surface-container-high');
  content = content.replace(/\bbg-surface-container-highest\b/g, 'bg-gray-300 dark:bg-surface-container-highest');

  // Transform text
  content = content.replace(/\btext-on-surface\b/g, 'text-black dark:text-on-surface');
  content = content.replace(/\btext-on-surface-variant\b/g, 'text-gray-600 dark:text-on-surface-variant');
  content = content.replace(/\btext-on-surface\/(10|20|30|40|50|60|70|80|90|95)\b/g, 'text-black/$1 dark:text-on-surface/$1');

  // Fix duplicates if any were created (e.g., bg-white dark:bg-white dark:bg-surface)
  content = content.replace(/bg-white dark:bg-white dark:bg-surface/g, 'bg-white dark:bg-surface');
  content = content.replace(/text-black dark:text-black dark:text-on-surface/g, 'text-black dark:text-on-surface');
  
  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});
