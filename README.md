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

## Setup

You need to have a `settings.json` file created in deployer folder to specify which github repo to deploy and it's name and branch.

You can use [settings-template.json](settings-template.json) as a template to create your `settings.json` file.

## Usage

To deploy your app and start it via PM2:

```bash
gulp
```

It will clone from target repo and start the application with pm2. Each time you updated your app's github repo, you can run this command again to re-deploy.

Use following PM2 commands to check the app's status:

```bash
pm2 list
pm2 logs
```

Once the app processes are running correctly, save the jobs so that they can get auto-started on server reboot:

```bash
pm2 save
```

Then you can run
```bash
pm2 startup
```
to make pm2 launch automatically when server reboot.

## Managing Process

Use the commands described in [pm2 docs](https://github.com/Unitech/PM2/blob/master/ADVANCED_README.md#usage) for process management.

## Logs

Usually you can take a quick look at deploy issue comments if there's any error. To get full process log, refering to [pm2 logs management](https://github.com/Unitech/PM2/blob/master/ADVANCED_README.md#a9).
