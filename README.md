# server-deployer
An auto deploy service using gulp/pm2/deploy-robot.

## Prerequisite

For a newly launched vps instance. Prepare the following environment.

- Install Nodejs (via [nvm](https://github.com/creationix/nvm))
- Install [gulp](https://github.com/gulpjs/gulp) globally
- Install [PM2](https://github.com/Unitech/PM2) globally

## Install

```bash
git clone git@github.com:fireball-x/server-deployer.git
cd server-deployer
npm install
```

## Usage

First start [deploy-robot](https://github.com/SegmentFault/deploy-robot) with pm2.

```bash
gulp start-deployer
```
It will create a process named `deployer` and watch for target repo newly created issue labeled with `deploy`. Check above link for deploy-robot usage example.

Then start application server:

```bash
gulp
```

It will clone from target repo and start the application with pm2. Each time you trigger a deploy with new issue, the above script will run, getting updates from target repo and restart server process.

Once the two processes are running correctly, save the jobs so that they can get auto-started on server reboot:

```bash
pm2 save
```

## Managing Process

Use the commands described in [pm2 docs](https://github.com/Unitech/PM2/blob/master/ADVANCED_README.md#usage) for process management.

## Logs

Usually you can take a quick look at deploy issue comments if there's any error. To get full process log, refering to [pm2 logs management](https://github.com/Unitech/PM2/blob/master/ADVANCED_README.md#a9).
