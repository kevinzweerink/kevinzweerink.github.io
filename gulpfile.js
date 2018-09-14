var gulp = require('gulp');
var sass = require('gulp-sass');
var s3 = require('gulp-s3');
require('dotenv').load();

var AWS = {
	"key":    process.env.AWS_ACCESS_KEY_ID,
  "secret": process.env.AWS_SECRET_KEY,
  "bucket": "kz-folio-assets",
  "region": "us-east-1"
}
 
gulp.task('sass', function () {
  return gulp.src('./scss/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./css'));
});
 
gulp.task('watch', ['sass'], function () {
  gulp.watch('./scss/**/*.scss', ['sass']);
});

gulp.task('videos', function () {
	gulp.src('./assets/project_videos/**')
		.pipe(s3(AWS));
});