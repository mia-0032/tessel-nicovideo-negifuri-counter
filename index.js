// Generated by CoffeeScript 1.8.0
(function() {
  var EventEmitter, HatyuneMiku, NicovideoApiParser, ServoMotor, api_parser, async, emitter, mainLoop, miku, previous_comment_num,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  async = require('async');

  EventEmitter = require('events').EventEmitter;

  emitter = new EventEmitter;

  ServoMotor = (function() {
    ServoMotor.PWM_FREQUENCY = 50;

    ServoMotor.MAX_DUTY_CYCLE = 0.125;

    ServoMotor.MIN_DUTY_CYCLE = 0.025;

    function ServoMotor(pin_name) {
      this.move = __bind(this.move, this);
      this.tessel = require('tessel');
      this.gpio = this.tessel.port['GPIO'];
      this.gpio.pwmFrequency(ServoMotor.PWM_FREQUENCY);
      this.pin = this.gpio.pin[pin_name];
    }

    ServoMotor.prototype.move = function(angle) {
      var duty_cycle;
      if (!((0 <= angle && angle <= 180))) {
        console.log("invalid angle: " + angle);
        return false;
      }
      duty_cycle = ServoMotor.MIN_DUTY_CYCLE;
      duty_cycle += (angle / 180) * (ServoMotor.MAX_DUTY_CYCLE - ServoMotor.MIN_DUTY_CYCLE);
      this.pin.pwmDutyCycle(duty_cycle);
      console.log('servo angle: ' + angle);
      return true;
    };

    return ServoMotor;

  })();

  HatyuneMiku = (function(_super) {
    __extends(HatyuneMiku, _super);

    HatyuneMiku.UPPER_ANGLE = 100;

    HatyuneMiku.LOWER_ANGLE = 60;

    function HatyuneMiku(pin_name) {
      this.doNegifuri = __bind(this.doNegifuri, this);
      HatyuneMiku.__super__.constructor.call(this, pin_name);
      this.move(HatyuneMiku.LOWER_ANGLE);
      this.move(HatyuneMiku.UPPER_ANGLE);
      this.move(HatyuneMiku.LOWER_ANGLE);
    }

    HatyuneMiku.prototype.doNegifuri = function(repeat_count) {
      var repeated;
      console.log("doNegifuri repetition:" + repeat_count);
      repeated = 0;
      async.forever((function(_this) {
        return function(callback) {
          return async.series([
            function(callback) {
              _this.move(HatyuneMiku.UPPER_ANGLE);
              return setTimeout(callback, 400);
            }, function(callback) {
              _this.move(HatyuneMiku.LOWER_ANGLE);
              return setTimeout(callback, 400);
            }, function(callback) {
              if (++repeated < repeat_count) {
                return callback();
              }
            }
          ], callback);
        };
      })(this), function(err) {
        console.log(err);
        return false;
      });
      return true;
    };

    return HatyuneMiku;

  })(ServoMotor);

  NicovideoApiParser = (function() {
    NicovideoApiParser.API_URL = 'http://ext.nicovideo.jp/api/getthumbinfo/';

    function NicovideoApiParser() {
      this.parse = __bind(this.parse, this);
      this.xml2js = require('xml2js');
      this.http = require('http');
    }

    NicovideoApiParser.prototype.parse = function(video_id) {
      var api_url;
      api_url = NicovideoApiParser.API_URL + video_id;
      console.log("HTTP request: " + api_url);
      return this.http.get(api_url, (function(_this) {
        return function(res) {
          var body;
          console.log("Status code: " + res.statusCode);
          body = '';
          res.setEncoding('utf8');
          res.on('data', function(chunk) {
            return body += chunk;
          });
          return res.on('end', function(res) {
            return _this.xml2js.parseString(body, function(err, result) {
              console.log(err);
              return emitter.emit('haveParsed', result);
            });
          });
        };
      })(this)).on('error', function(e) {
        return console.log("Got error: " + e.message);
      });
    };

    return NicovideoApiParser;

  })();

  api_parser = new NicovideoApiParser;

  miku = new HatyuneMiku('G4');

  previous_comment_num = null;

  emitter.on('haveParsed', function(result) {
    var comment_num, difference;
    comment_num = result['nicovideo_thumb_response']['thumb'][0]['comment_num'][0];
    comment_num = parseInt(comment_num, 10);
    console.log("Comment: " + comment_num);
    if (previous_comment_num != null) {
      difference = comment_num - previous_comment_num;
      console.log("Comment diff: " + difference);
      if (difference > 0) {
        miku.doNegifuri(difference);
      }
    }
    return previous_comment_num = comment_num;
  });

  mainLoop = function() {
    api_parser.parse('1397552685');
    return setTimeout(mainLoop, 60000);
  };

  console.log('Tessel started!');

  setImmediate(mainLoop);

}).call(this);
