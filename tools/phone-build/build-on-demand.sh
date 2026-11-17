#!/usr/bin/env bash
# PHONE-01/#322 + PHONE-02/#323 (epic #95): one-click on-demand sandbox build.
# The host eas-cli session (~/.expo) authenticates this — no tokens live here;
# EXPO_TOKEN in GitHub secrets is only for the CI trigger (PHONE-02).
#
# Usage:
#   build-on-demand.sh          launch a cloud build, notify, poll to completion
#   build-on-demand.sh poll <build-page-url> <log-file>
#                               detached helper: final desktop notification
set -euo pipefail

SELF="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_DIR="$REPO_ROOT/.scratch/phone-build"
mkdir -p "$LOG_DIR"

notify() { notify-send -a "KUDY" "$1" "${2:-}" 2>/dev/null || true; }

if [ "${1:-}" = "poll" ]; then
  # Detached tail of one build: desktop notification on the final status.
  url="$2"; log="$3"; id="${url##*/}"
  unknown=0
  for _ in $(seq 1 120); do
    # A failed eas call (expired session, network hiccup) must answer with an
    # unknown status, never kill the poller silently (set -e).
    st="$((eas build:view "$id" --json 2>/dev/null || echo '{}') | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const s=JSON.parse(d).status;console.log(typeof s==="string"?s:"?")}catch(e){console.log("?")}})')"
    case "$st" in
      FINISHED)
        notify "KUDY Sandbox — білд готы" "Усталяванне па QR: $url"
        exit 0 ;;
      ERRORED|CANCELED)
        notify "KUDY Sandbox — білд упал ($st)" "Лаг і прычына: $url"
        exit 1 ;;
    esac
    # Corrupt url or dead eas session must not masquerade as a long queue.
    if [ "$st" = "?" ]; then
      unknown=$((unknown + 1))
      if [ "$unknown" -ge 10 ]; then
        notify "KUDY Sandbox — статус невядомы" "Правер eas-сесію і спасылку: $url (лог: $log)"
        exit 1
      fi
    else
      unknown=0
    fi
    sleep 60
  done
  notify "KUDY Sandbox — білд доўга ў чарзе" "Правер уручную: $url"
  exit 0
fi

# Default mode: launch the build from the current working tree.
LOG="$LOG_DIR/on-demand-$(date -u +%Y%m%dT%H%M%S).log"
cd "$REPO_ROOT"
notify "KUDY" "Зборка запушчана — паведамлю на стале пра гатоўнасць"

if ! eas build --profile sandbox --platform android --no-wait --non-interactive 2>&1 | tee "$LOG"; then
  notify "KUDY — зборку не запушчана" "Памылка ў $LOG"
  exit 1
fi

BUILD_URL="$(grep -oE 'https://expo\.dev/accounts/[^ ]+/builds/[0-9a-f-]+' "$LOG" | tail -1 || true)"
if [ -z "$BUILD_URL" ]; then
  notify "KUDY — зборка запушчана" "Спасылка не знойдзена ў $LOG"
  exit 0
fi

notify "KUDY — зборка ў хмары" "Старонка зборкі: $BUILD_URL"
nohup "$SELF" poll "$BUILD_URL" "$LOG" >/dev/null 2>&1 &
