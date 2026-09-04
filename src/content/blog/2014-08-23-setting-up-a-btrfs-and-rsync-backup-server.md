---
title: Setting up a BTRFS and rsync backup server
description: Setting up a BTRFS and rsync backup server
pubDate: "Aug 23 2014"
heroImage: "../../assets/blog-placeholder-3.jpg"
---

**Who is this for?**

This is for people who came across the following issues with current backup solutions:

- You have multiple computers, but you want to sync all backups onto one of them.

- You want the benefits of rsnapshot - daily, weekly, and monthly snapshots.

- You want the efficient COW (copy-on-write) benefits of BTRFS.

- You want to back all of this up onto a single, designated backup disk.

**Syncing from remote nodes to the server.**

On the client, nothing complicated is really happening. Just a simple cron job is syncing down to the server using rsync.

For this to work, you will need to add your client public key to the authorized_keys on the server, and install rsync on both the client and server.

Here is a little script I wrote to handle things nicely:

```bash
#!/bin/bash

DIRECTORIES='/etc /usr/local /home'
# This doesn't have to be a host name.
# It could be called something like "laptop"
#COMP_NAME=`hostname`
COMP_NAME=laptop
SERVER_HOST=redplatypus
BACKUP_DIR=/mnt/backup

function send_package_info {
	PACAKGE_INFO_PATH="$BACKUP_DIR/misc_info/${COMP_NAME}_installed_packages.txt"
	# This is for Arch Linux
	# It just lists the currently installed packages and syncs them down.
	pacman -Q |
		ssh $SERVER_HOST "cat > $PACAKGE_INFO_PATH"
}

function syncdown {
	send_package_info
	SYNC_DIR="$SERVER_HOST:$BACKUP_DIR/${COMP_NAME}_sync/"
	rsync -azrR -e ssh $DIRECTORIES root@$SYNC_DIR
}

# Sync if the lab host is accessible.
ping -c 1 $SERVER_HOST && syncdown
```

I recommend placing this in `/usr/local/bin/` and giving it the permissions `700` (for root only).

In my root crontab, I have this script set to run every hour at ??:30. On the server, we will be snapshotting everything at ??:00, so this prevents any possible conflicts.

```
30 * * * * /usr/local/bin/sync_to_backup_server.sh
```

**Setting up the server.**

If you haven't already guessed, you should have a BTRFS formatted drive connected to your backup server and mounted (possibly at /mnt/backup).

Normally with rsnapshot, everything is synced into a .sync directory. BUT. With this solution, we create .sync as a BTRFS subvolume:

```
root redplatypus 17:59 :) /mnt/backup
# btrfs subvolume create .sync
```

You will need a few hacky scripts to trick rsnapshot into creating new subvolumes instead of directories as well. Place these in /usr/local/bin:

`rsnapshot_cp_btrfs`:

```sh
#!/bin/sh

# Based on http://wwerther.de/2011/10/migrate-rsnapshot-based-backup-to-btrfs-snapshots/

# Arg 1: -al
# Arg 2: /backups/hourly.0 or /backups/.sync
# Arg 3: /backups/hourly.1

if [  "$1" = "-al" ]; then
        exec btrfs subvolume snapshot -r $2 $3
else
        /usr/bin/cp --reflink=auto $@
fi
```

`rsnapshot_rm_btrfs`:

```sh
#!/bin/sh

# Based on http://wwerther.de/2011/10/migrate-rsnapshot-based-backup-to-btrfs-snapshots/

# Arg 1: -rf
# Arg 2: /testbtrfs/backups/hourly.4/

# echo 1: $1  2: $@

# Try to delete the given path with btrfs subvolume delete first
# if this fails fall back to normal rm
if [  "$1" = "-rf"  -a  "$3" = ""  ]; then
        # "trying to delete with btrfs"
        btrfs subvolume delete $2
        error=$?
        if [ $error -eq 13 ]; then
                # EC 13 => The directory specified is not a subvolume
                rm $@
        elif [ $error -ne 0 ]; then
                echo Error while deleting with btrfs $?
        fi
else
        rm $@
fi
```

Now in `/etc/rsnapshot.conf`, you will want to set the following params:

```
snapshot_root /mnt/backup/
no_create_root  1
cmd_cp    /usr/local/bin/rsnapshot_cp_btrfs
cmd_rm    /usr/local/bin/rsnapshot_rm_btrfs
sync_first  1
```

As well of this, you will of course want to configure the interval options.

Here are mine:

```
interval  hourly  7
interval  daily 7
interval  weekly  4
interval  monthly 3
```

Now you just configure your rsnapshot backup directories. Here is my config:

```
# LOCALHOST
backup  /home/    lab_backup/home/  exclude=.cache
backup  /etc/   lab_backup/etc/
backup  /usr/local/ lab_backup/usr/local/
backup  /srv/ lab_backup/srv/
# My laptop syncs here.
backup  /mnt/backup/laptop_sync/home/ laptop_backup/home/
backup  /mnt/backup/laptop_sync/etc/  laptop_backup/etc/
backup  /mnt/backup/laptop_sync/usr/local/  laptop_backup/usr/local/
```

Last but not least, we add some crontab entries to snapshot ALL THE THINGS:

```
# 'rsnapshot sync' is the only command that pulls files into the '.sync' directory
0       *       *       *       *       /usr/bin/rsnapshot sync && /usr/bin/rsnapshot -v hourly
30      22      *       *       *       /usr/bin/rsnapshot -v daily
35      22      *       *       0       /usr/bin/rsnapshot -v weekly
40      22      31      *       *       /usr/bin/rsnapshot -v monthly
```

Now you have a nice backup system, and don't have to worry about losing files whenever you throw your laptop out the window!

**Acknowledgements.**

I would like to thank Walter Werther who wrote [an article](http://wwerther.de/2011/10/migrate-rsnapshot-based-backup-to-btrfs-snapshots/) that I ripped some techniques out of.
