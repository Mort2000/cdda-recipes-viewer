const del = require('del');
const path = require('path');
const gulp = require('gulp');
const po2json = require('gulp-po2json');
const merge = require('gulp-merge-json');

const buildDir = path.resolve(`${__dirname}/.build`);
const srcDir = path.resolve(`${__dirname}/.cataclysmdda`);

const mergeOptions = fileName => ({
  fileName,
  startObj: [],
  exportModule: true,
  concatArrays: true,
});

gulp.task('clean', (cb) => {
  del(['dist/**/*', '.build/**/*'], cb);
});

gulp.task('i18n', () => {
  gulp.src(`${srcDir}/po/*.po`)
    .pipe(po2json())
    .pipe(gulp.dest(`${buildDir}/locales`));
});

gulp.task('recipes', () => {
  gulp.src(`${srcDir}/json/recipes/**/*.json`)
    .pipe(merge(mergeOptions('recipes.js')))
    .pipe(gulp.dest(buildDir));
});

gulp.task('requirements', () => {
  gulp.src(`${srcDir}/json/requirements/**/*.json`)
    .pipe(merge(mergeOptions('requirements.js')))
    .pipe(gulp.dest(buildDir));
});

gulp.task('items', () => {
  gulp.src([`${srcDir}/json/materials.json`, `${srcDir}/json/items/**/*.json`])
    .pipe(merge(mergeOptions('items.js')))
    .pipe(gulp.dest(buildDir));
});

gulp.task('default', ['i18n', 'recipes', 'items', 'requirements']);
