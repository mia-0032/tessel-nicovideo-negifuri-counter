tessel-nicovideo-negifuri-counter
=================================

check my uploaded videos in niconico and notice to me by negifuri if the video commented

## Setup

Connect your servo motor control line to Tessel `G4` port.

```
# setup WiFi.
$ tessel wifi -n YOUR_WIFI_SSID -p YOUR_WIFI_PASSWORD
```

```
# setup this application.
$ git clone https://github.com/mia-0032/tessel-nicovideo-negifuri-counter.git
$ cd tessel-nicovideo-negifuri-counter
$ npm install
```

## Test Run

```
$ tessel run index.js
```

## Stand-alone Run

```
$ tessel push index.js
```
