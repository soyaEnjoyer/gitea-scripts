#!/usr/bin/env bash
set -euo pipefail
trap 'echo "error on line $LINENO; bash -x ${0##*/} to debug"' ERR

declare -ri retention=5
declare -r file_name_format='gitea-%(%y%m%d_%H%M%S)T.zip'
declare -r backup_dir='/mnt/backup/gitea'

# `file_name_format` is a template string. printf expands the time format internally
# shellcheck disable=SC2059
printf -v file_name "$file_name_format"
echo "backing up to $file_name"
docker exec -i gitea gitea dump -f "/backup/$file_name"

cd "$backup_dir" || exit 1
declare -a backups
mapfile -t backups < <(find . -type f -name '*.zip' | sort -r)
for i in "${!backups[@]}"; do
  # `i` is an integer
  # shellcheck disable=SC2086,SC2184
  [ $i -ge $retention ] || unset backups[$i]
done
if ((${#backups[@]})); then
  echo "  rm expired: ${backups[*]}"
  rm "${backups[@]}"
fi

echo "backed up to $file_name"
