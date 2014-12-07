async = require 'async'
{EventEmitter} = require 'events'
emitter = new EventEmitter

class ServoMotor
  @PWM_FREQUENCY = 50 # Hz
  @MAX_DUTY_CYCLE = 0.125 # 2500us
  @MIN_DUTY_CYCLE = 0.025 # 500us
  constructor: (pin_name) ->
    @tessel = require 'tessel'
    @gpio = @tessel.port['GPIO']
    @gpio.pwmFrequency(ServoMotor.PWM_FREQUENCY)
    @pin = @gpio.pin[pin_name]
  move: (angle) =>
    unless 0 <= angle <= 180
      console.log "invalid angle: #{angle}"
      return false
    duty_cycle = ServoMotor.MIN_DUTY_CYCLE
    duty_cycle += (angle / 180) * (ServoMotor.MAX_DUTY_CYCLE - ServoMotor.MIN_DUTY_CYCLE)
    @pin.pwmDutyCycle(duty_cycle)
    console.log('servo angle: ' + angle)
    true

class HatyuneMiku extends ServoMotor
  @UPPER_ANGLE = 100
  @LOWER_ANGLE = 60
  constructor: (pin_name) ->
    super pin_name
    @move HatyuneMiku.LOWER_ANGLE
  doNegifuri: (repeat_count) =>
    console.log("doNegifuri repetition:#{repeat_count}")
    repeated = 0
    async.forever((callback) =>
      async.series([
        (callback) =>
          @move HatyuneMiku.UPPER_ANGLE
          setTimeout callback, 400
        ,
        (callback) =>
          @move(HatyuneMiku.LOWER_ANGLE)
          setTimeout callback, 400
        ,
        (callback) =>
          if (++repeated < repeat_count)
            callback()
      ], callback)
    ,
    (err) ->
      console.log(err)
      return false
    )
    true

class NicovideoApiParser
  @API_URL = 'http://ext.nicovideo.jp/api/getthumbinfo/'
  constructor: ->
    @xml2js = require 'xml2js'
    @http = require 'http'
  parse: (video_id) =>
    api_url = NicovideoApiParser.API_URL + video_id
    console.log "HTTP request: #{api_url}"
    @http.get(api_url,
      (res) =>
        console.log "Status code: #{res.statusCode}"
        body = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) -> body += chunk)
        res.on('end', (res) =>
          @xml2js.parseString body, (err, result) ->
            console.log err
            emitter.emit 'haveParsed', result
        )
    ).on('error', (e) ->
      console.log "Got error: #{e.message}"
    )

api_parser = new NicovideoApiParser
miku = new HatyuneMiku('G4')
previous_comment_num = null

emitter.on 'haveParsed', (result) ->
  comment_num = result['nicovideo_thumb_response']['thumb'][0]['comment_num'][0]
  comment_num = parseInt(comment_num, 10)
  console.log "Comment: #{comment_num}"
  if previous_comment_num?
    difference = comment_num - previous_comment_num
    console.log "Comment diff: #{difference}"
    if difference > 0
      miku.doNegifuri difference
  previous_comment_num = comment_num

mainLoop = ->
  api_parser.parse '1397552685'
  setTimeout mainLoop, 60000

console.log 'Tessel started!'
setImmediate mainLoop
