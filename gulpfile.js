var gulp = require('gulp');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var gulpSequence = require('gulp-sequence');
var pm2 = require('pm2');
var path = require('path');
var del = require('del');
var os = require('os');
var fs = require('fs');
var settings = JSON.parse(fs.readFileSync('settings.json'));
/* settings template
*{
*  "repoUrl": "git@github.com:fireball-x/packages.git",
*  "pathName": "packages",
*  "branch": "master"
*}
*/
var repoUrl = settings.repoUrl;
var pathName = settings.pathName;
var tmpPath = path.join(os.tmpdir(), pathName);
var destPath = path.join(process.env.HOME, pathName);

gulp.task('get-repo', function(cb) {
    del(tmpPath, {force: true}, function() {
        var child = spawn('git', ['clone', repoUrl, tmpPath]);
        child.stdout.on('data', function(data) {
            console.log(data.toString());
        });
        child.on('exit', function () {
            return cb();
        });
    });
});

gulp.task('update-repo', function(cb) {
      var child = spawn('git', ['pull', 'origin'], {
        cwd: tmpPath
      });
      child.stdout.on('data', function(data) {
          console.log(data.toString());
      });
      child.on('exit', function () {
          return cb();
      });
});

gulp.task('checkout', function(cb) {
    var child = spawn('git', ['checkout', settings.branch], {
        cwd: tmpPath
    });
    child.stdout.on('data', function(data) {
        console.log(data.toString());
    });
    child.on('exit', function() {
        return cb();
    });
});

gulp.task('install', function(cb) {
    var child = spawn('npm', ['install'], {
        cwd: tmpPath
    });
    child.stdout.on('data', function(data) {
        console.log(data.toString());
    });
    child.on('exit', function() {
        return cb();
    });
});

gulp.task('clean', function(cb) {
    del(destPath, {force: true}, function() {
        return cb();
    });
});

gulp.task('copy', function() {
    return gulp.src([path.join(tmpPath,'**/*')])
                .pipe(gulp.dest(destPath));
});

var checkIfServerRunning = function(cb) {
    pm2.connect(function(err) {
        // Start a script on the current folder
        //pm2.start('test.js', { name: 'test' }, function(err, proc) {
        if (err) throw new Error('err');
        // Get all processes running
        pm2.list(function(err, process_list) {
            if (err) throw err;
            //console.log(process_list);
            var result = false;
            for (var i = 0; i < process_list.length; ++i) {
                var proc = process_list[i];
                console.log(proc.pm2_env.name);
                console.log(proc.pm2_env.status);
                if (proc.pm2_env.name === pathName && proc.pm2_env.status === 'online') {
                    result = true;
                    break;
                }
            }
            // Disconnect to PM2
            pm2.disconnect(function() {
                return cb(result);
            });
        });
    });
};

// gulp.task("test",function(cb) {
//    checkIfServerRunning(function(result) {
//        console.log('Server running: ' + result);
//        cb();
//    });
// });

gulp.task('stop', function() {
  var child = spawn('pm2', ['stop', pathName]);
  child.on('data', function(data) {
    console.log(data.toString());
  });
  return child;
});

gulp.task('run', function(cb) {
  var entry = JSON.parse(fs.readFileSync(path.join(destPath, 'package.json'))).main;
  var child = spawn('pm2', ['start', entry, '--name', pathName, '--node-args="--max-old-space-size=200"'], {
    cwd: destPath
  });
  child.on('exit', function() {
    console.log("start process...");
    return cb();
  });
});
//
// gulp.task('check', function(cb) {
//   setTimeout(function() {
//     var child = spawn('curl', ['http://localhost:3000']);
//     child.stdout.on('data', function(data) {
//       console.log(data.toString());
//       var status = JSON.parse(data.toString());
//       if (status.uptime && status.started) {
//         console.log("server is running.");
//         return cb();
//       }
//     });
//     child.stderr.on('data', function(data) {
//       console.log(data.toString());
//       if (data.toString().indexOf('Failed') !== -1) {
//         console.log("server started failed");
//         process.kill();
//       }
//     });
//   }, 10000);
// });

gulp.task('default', gulpSequence('get-repo', 'checkout', 'install', 'stop', 'clean', 'copy', 'run'));

gulp.task('update', gulpSequence('update-repo', 'stop', 'clean', 'copy', 'run'));

// gulp.task('start-deployer', function(cb) {
//     var child = exec('pm2 start node_modules/deploy-robot/build/robot.js  --name deployer --max-memory-restart 40M -- -c config.json', {
//         cwd: __dirname
//     }, function(error, stdout, stderr) {
//         console.log(stdout);
//         console.log(stderr);
//         if (error !== null) {
//           console.log('exec error: ' + error);
//         }
//         return cb();
//     });
//     // child.stdout.on('data', function(data) {
//     //     console.log(data.toString());
//     // });
//     // return child;
// });
