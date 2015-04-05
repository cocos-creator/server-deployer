var gulp = require('gulp');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var gulpSequence = require('gulp-sequence');
var pm2 = require('pm2');
var path = require('path');
var del = require('del');
var os = require('os');
var repoUrl = 'git@github.com:fireball-x/developer-accounts.git';
var tmpPath = path.join(os.tmpdir(), 'account-server');
var destPath = path.join(process.env.HOME,'account-server');

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

gulp.task('checkout', function(cb) {
    var child = spawn('git', ['checkout', 'develop'], {
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
                if (proc.pm2_env.name === 'account-server' && proc.pm2_env.status === 'online') {
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

gulp.task("test",function(cb) {
   checkIfServerRunning(function(result) {
       console.log('Server running: ' + result);
       cb();
   });
});

gulp.task('run', function(cb) {
    checkIfServerRunning(function(result) {
        if (result) {
            console.log("skipping start process.");
            return cb();
        } else {
            var child = spawn('pm2', ['start', 'server/server.js', '--watch', '--name', 'account-server'], {
                cwd: destPath
            });
            child.on('exit', function() {
                console.log("start process...");
                return cb();
            });
        }
    });
});

gulp.task('check', function(cb) {
  setTimeout(function() {
    var child = spawn('curl', ['http://localhost:3000']);
    child.stdout.on('data', function(data) {
      console.log(data.toString());
      var status = JSON.parse(data.toString());
      if (status.uptime && status.started) {
        console.log("server is running.");
        return cb();
      }
    });
    child.stderr.on('data', function(data) {
      console.log(data.toString());
      if (data.toString().indexOf('Failed') !== -1) {
        console.log("server started failed");
        process.kill();
      }
    });
  }, 10000);
});

gulp.task('default', gulpSequence('get-repo', 'checkout', 'install', 'clean', 'copy', 'run', 'check'));

gulp.task('start-deployer', function(cb) {
    var child = exec('pm2 start node_modules/deploy-robot/build/robot.js  --name deployer -- -c config.json', {
        cwd: __dirname
    }, function(error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (error !== null) {
          console.log('exec error: ' + error);
        }
        return cb();
    });
    // child.stdout.on('data', function(data) {
    //     console.log(data.toString());
    // });
    // return child;
})
