var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var pump = require('pump');
var del = require('del');
var gulpsync = require('gulp-sync')(gulp);
var browserSync = require('browser-sync').create();

var source = 'source/', destination = 'build/'; // Definition of source and build folder names

gulp.task('html', function(callback) {
	pump([
		gulp.src(source + '*.html'), // Take all files with extension 'html'
		plugins.htmlmin({collapseWhitespace: true}), // Remove all whitespaces from HTML code
		gulp.dest(destination) // and put it into build folder.
	], callback);
});

gulp.task('sass', function(callback) {
	pump([
		gulp.src(source + '*.sass'),  // Take all files with extension 'sass'
		plugins.sass(), // Compile them to CSS using gulp-sass plugin
		plugins.autoprefixer({browsers: ['last 2 versions'], cascade: false}), // Autoprefix CSS to support last two versions of each popular browser
		plugins.cleanCss(), // Minimize CSS
		gulp.dest(destination), // and put CSS into build folder.
		browserSync.stream() // Inject updated CSS code to browser without reloading it
	], callback);
});

gulp.task('js', function(callback) {
	pump([
		gulp.src(source + '*.js'), // Take all files with extension 'js'
		plugins.uglify(), // Minimize JavaScript code
		gulp.dest(destination) // and put it into build folder.
	], callback);
});

gulp.task('clean', function() {
	return del(destination + '*') // Delete everything from the 'build' folder
});

gulp.task('build', gulpsync.sync(['clean', ['html', 'sass', 'js']])); // Run clean task first, and then all the others

gulp.task('default', ['build'],  function() {
	gulp.watch(source + '*.sass', ['sass']); // Runs 'sass' task if files with 'sass' extensions change in source folder
	gulp.watch(source + '*.js', ['js']);
	gulp.watch(source + '*.html', ['html']);

	gulp.watch(destination + '!(*.css)').on('change', browserSync.reload); // reload browser when any file changes in build folder, but files with 'css' extenson. We'll inject changed css files in 'sass' task

	browserSync.init({ // Initialization of BrowserSync plugin
		server: {
			baseDir: destination // BrowserSync's server will serve content from the 'build' folder
		}
	});
});

gulp.task('upload', ['build'], function (callback) { // Before uploading, we have to make sure, that project has been built.
	pump([
		gulp.src(destination + '/**/*'), // Upload everything from 'build' directory including folders structure.
		plugins.sftp({
			host: 'example.com', // Remote host. Could be a hostname or an ip address.
            user: 'root', // Username.
            key: { location:'~/Keys/example.com.key', passphrase: 'secret' }, // Path to the server's SSH key and passphrase for it.
			remotePath: '/usr/share/nginx/html/' // Path on the host, to where plugin should upload project's files.
		})
	], callback);
});
