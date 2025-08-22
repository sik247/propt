#!/bin/bash

# Get the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

start() {
    echo "Starting server..."
    nohup python3 "$DIR/run_server.py" > "$DIR/../server.log" 2>&1 &
    echo $! > "$DIR/../server.pid"
    echo "Server started. PID: $(cat $DIR/../server.pid)"
    echo "Logs available in server.log"
}

stop() {
    if [ -f "$DIR/../server.pid" ]; then
        echo "Stopping server..."
        kill $(cat "$DIR/../server.pid")
        rm "$DIR/../server.pid"
        echo "Server stopped"
    else
        echo "Server not running"
    fi
}

status() {
    if [ -f "$DIR/../server.pid" ]; then
        PID=$(cat "$DIR/../server.pid")
        if ps -p $PID > /dev/null; then
            echo "Server is running. PID: $PID"
        else
            echo "Server crashed or stopped unexpectedly"
            rm "$DIR/../server.pid"
        fi
    else
        echo "Server not running"
    fi
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        sleep 2
        start
        ;;
    status)
        status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac

exit 0
